// <copyright file="Engine.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text.Json;

namespace Praxis.Core;

/// <summary>
/// Options for creating a Praxis engine.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed record PraxisEngineOptions<TContext>
{
    /// <summary>
    /// Gets the initial context.
    /// </summary>
    public required TContext InitialContext { get; init; }

    /// <summary>
    /// Gets the registry of rules and constraints.
    /// </summary>
    public required PraxisRegistry<TContext> Registry { get; init; }

    /// <summary>
    /// Gets the initial facts (optional).
    /// </summary>
    public IReadOnlyList<PraxisFact>? InitialFacts { get; init; }

    /// <summary>
    /// Gets the initial metadata (optional).
    /// </summary>
    public IReadOnlyDictionary<string, JsonElement>? InitialMeta { get; init; }
}

/// <summary>
/// The Praxis Logic Engine.
/// Manages application logic through facts, events, rules, and constraints.
/// The engine is strongly typed and functional - all state updates are immutable.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed class LogicEngine<TContext>
{
    private PraxisState _state;
    private TContext _context;
    private readonly PraxisRegistry<TContext> _registry;

    /// <summary>
    /// Initializes a new instance of the <see cref="LogicEngine{TContext}"/> class.
    /// </summary>
    /// <param name="options">The engine options.</param>
    public LogicEngine(PraxisEngineOptions<TContext> options)
    {
        _registry = options.Registry;
        _context = options.InitialContext;
        _state = new PraxisState(
            Context: JsonSerializer.SerializeToElement(options.InitialContext),
            Facts: options.InitialFacts?.ToList() ?? [],
            Meta: options.InitialMeta,
            ProtocolVersion: PraxisProtocol.Version);
    }

    /// <summary>
    /// Gets the current state (immutable copy).
    /// </summary>
    /// <returns>A copy of the current state.</returns>
    public PraxisState GetState() => _state;

    /// <summary>
    /// Gets the current typed context.
    /// </summary>
    /// <returns>A copy of the current context.</returns>
    public TContext GetContext() => _context;

    /// <summary>
    /// Gets the current facts.
    /// </summary>
    /// <returns>A copy of the current facts.</returns>
    public IReadOnlyList<PraxisFact> GetFacts() => _state.Facts.ToList();

    /// <summary>
    /// Processes events through the engine.
    /// Applies all registered rules and checks all registered constraints.
    /// </summary>
    /// <param name="events">Events to process.</param>
    /// <returns>Result with new state and diagnostics.</returns>
    public PraxisStepResult Step(IReadOnlyList<PraxisEvent> events)
    {
        var config = new PraxisStepConfig(
            RuleIds: _registry.GetRuleIds(),
            ConstraintIds: _registry.GetConstraintIds());
        return StepWithConfig(events, config);
    }

    /// <summary>
    /// Processes events with specific rule and constraint configuration.
    /// </summary>
    /// <param name="events">Events to process.</param>
    /// <param name="config">Step configuration.</param>
    /// <returns>Result with new state and diagnostics.</returns>
    public PraxisStepResult StepWithConfig(
        IReadOnlyList<PraxisEvent> events,
        PraxisStepConfig config)
    {
        var diagnostics = new List<PraxisDiagnostics>();
        var newFacts = new List<PraxisFact>();

        // Apply rules
        foreach (var ruleId in config.RuleIds)
        {
            var rule = _registry.GetRule(ruleId);
            if (rule == null)
            {
                diagnostics.Add(new PraxisDiagnostics(
                    Kind: DiagnosticKind.RuleError,
                    Message: $"Rule \"{ruleId}\" not found in registry",
                    Data: JsonSerializer.SerializeToElement(new { ruleId })));
                continue;
            }

            try
            {
                var ruleFacts = rule.Impl(_state, _context, events);
                newFacts.AddRange(ruleFacts);
            }
            catch (Exception ex)
            {
                diagnostics.Add(new PraxisDiagnostics(
                    Kind: DiagnosticKind.RuleError,
                    Message: $"Error executing rule \"{ruleId}\": {ex.Message}",
                    Data: JsonSerializer.SerializeToElement(new { ruleId, error = ex.Message })));
            }
        }

        // Add new facts to state
        var newState = _state.WithFacts(newFacts);

        // Check constraints
        foreach (var constraintId in config.ConstraintIds)
        {
            var constraint = _registry.GetConstraint(constraintId);
            if (constraint == null)
            {
                diagnostics.Add(new PraxisDiagnostics(
                    Kind: DiagnosticKind.ConstraintViolation,
                    Message: $"Constraint \"{constraintId}\" not found in registry",
                    Data: JsonSerializer.SerializeToElement(new { constraintId })));
                continue;
            }

            try
            {
                var result = constraint.Impl(newState, _context);
                if (!result.IsValid)
                {
                    var message = result.Message ?? $"Constraint \"{constraintId}\" violated";
                    diagnostics.Add(new PraxisDiagnostics(
                        Kind: DiagnosticKind.ConstraintViolation,
                        Message: message,
                        Data: JsonSerializer.SerializeToElement(new { constraintId, description = constraint.Description })));
                }
            }
            catch (Exception ex)
            {
                diagnostics.Add(new PraxisDiagnostics(
                    Kind: DiagnosticKind.ConstraintViolation,
                    Message: $"Error checking constraint \"{constraintId}\": {ex.Message}",
                    Data: JsonSerializer.SerializeToElement(new { constraintId, error = ex.Message })));
            }
        }

        // Update internal state
        _state = newState;

        return new PraxisStepResult(
            State: newState,
            Diagnostics: diagnostics);
    }

    /// <summary>
    /// Updates the context directly (for exceptional cases).
    /// Generally, context should be updated through rules.
    /// </summary>
    /// <param name="updater">Function that produces new context from old context.</param>
    public void UpdateContext(Func<TContext, TContext> updater)
    {
        _context = updater(_context);
        _state = _state.WithContext(_context);
    }

    /// <summary>
    /// Adds facts directly (for exceptional cases).
    /// Generally, facts should be added through rules.
    /// </summary>
    /// <param name="facts">Facts to add.</param>
    public void AddFacts(IEnumerable<PraxisFact> facts)
    {
        _state = _state.WithFacts(facts);
    }

    /// <summary>
    /// Clears all facts.
    /// </summary>
    public void ClearFacts()
    {
        _state = _state with { Facts = [] };
    }

    /// <summary>
    /// Resets the engine to initial state.
    /// </summary>
    /// <param name="options">New engine options.</param>
    public void Reset(PraxisEngineOptions<TContext> options)
    {
        _context = options.InitialContext;
        _state = new PraxisState(
            Context: JsonSerializer.SerializeToElement(options.InitialContext),
            Facts: options.InitialFacts?.ToList() ?? [],
            Meta: options.InitialMeta,
            ProtocolVersion: PraxisProtocol.Version);
    }
}

/// <summary>
/// Factory methods for creating Praxis engines.
/// </summary>
public static class PraxisEngine
{
    /// <summary>
    /// Creates a new Praxis logic engine.
    /// </summary>
    /// <typeparam name="TContext">The type of the application context.</typeparam>
    /// <param name="options">Engine options.</param>
    /// <returns>A new LogicEngine instance.</returns>
    public static LogicEngine<TContext> Create<TContext>(PraxisEngineOptions<TContext> options) =>
        new(options);
}
