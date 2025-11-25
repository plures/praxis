// <copyright file="Rules.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

namespace Praxis.Core;

/// <summary>
/// A rule function derives new facts from context + input facts/events.
/// Rules must be pure - no side effects.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
/// <param name="state">Current Praxis state with typed context.</param>
/// <param name="events">Events to process.</param>
/// <returns>Array of new facts to add to the state.</returns>
public delegate IEnumerable<PraxisFact> RuleFn<in TContext>(
    PraxisState state,
    TContext context,
    IReadOnlyList<PraxisEvent> events);

/// <summary>
/// A constraint function checks that an invariant holds.
/// Constraints must be pure - no side effects.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
/// <param name="state">Current Praxis state with typed context.</param>
/// <returns>ConstraintResult indicating success or failure with message.</returns>
public delegate ConstraintResult ConstraintFn<in TContext>(
    PraxisState state,
    TContext context);

/// <summary>
/// Result of a constraint check.
/// </summary>
public readonly record struct ConstraintResult
{
    /// <summary>
    /// Gets a value indicating whether the constraint passed.
    /// </summary>
    public bool IsValid { get; init; }

    /// <summary>
    /// Gets the error message if the constraint failed.
    /// </summary>
    public string? Message { get; init; }

    /// <summary>
    /// Creates a successful constraint result.
    /// </summary>
    public static ConstraintResult Success => new() { IsValid = true };

    /// <summary>
    /// Creates a failed constraint result with a message.
    /// </summary>
    /// <param name="message">The error message.</param>
    /// <returns>A failed ConstraintResult.</returns>
    public static ConstraintResult Failure(string message) => new() { IsValid = false, Message = message };

    /// <summary>
    /// Implicit conversion from bool to ConstraintResult.
    /// </summary>
    public static implicit operator ConstraintResult(bool isValid) => new() { IsValid = isValid };

    /// <summary>
    /// Implicit conversion from string to failed ConstraintResult.
    /// </summary>
    public static implicit operator ConstraintResult(string message) => Failure(message);
}

/// <summary>
/// Descriptor for a rule, including its ID, description, and implementation.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed record RuleDescriptor<TContext>
{
    /// <summary>
    /// Gets the unique identifier for the rule.
    /// </summary>
    public required string Id { get; init; }

    /// <summary>
    /// Gets the human-readable description.
    /// </summary>
    public required string Description { get; init; }

    /// <summary>
    /// Gets the implementation function.
    /// </summary>
    public required RuleFn<TContext> Impl { get; init; }

    /// <summary>
    /// Gets optional metadata.
    /// </summary>
    public IReadOnlyDictionary<string, object>? Meta { get; init; }
}

/// <summary>
/// Descriptor for a constraint, including its ID, description, and implementation.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed record ConstraintDescriptor<TContext>
{
    /// <summary>
    /// Gets the unique identifier for the constraint.
    /// </summary>
    public required string Id { get; init; }

    /// <summary>
    /// Gets the human-readable description.
    /// </summary>
    public required string Description { get; init; }

    /// <summary>
    /// Gets the implementation function.
    /// </summary>
    public required ConstraintFn<TContext> Impl { get; init; }

    /// <summary>
    /// Gets optional metadata.
    /// </summary>
    public IReadOnlyDictionary<string, object>? Meta { get; init; }
}

/// <summary>
/// A Praxis module bundles rules and constraints.
/// Modules can be composed and registered with the engine.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed record PraxisModule<TContext>
{
    /// <summary>
    /// Gets the rules in this module.
    /// </summary>
    public IReadOnlyList<RuleDescriptor<TContext>> Rules { get; init; } = [];

    /// <summary>
    /// Gets the constraints in this module.
    /// </summary>
    public IReadOnlyList<ConstraintDescriptor<TContext>> Constraints { get; init; } = [];

    /// <summary>
    /// Gets optional module metadata.
    /// </summary>
    public IReadOnlyDictionary<string, object>? Meta { get; init; }
}

/// <summary>
/// Registry for rules and constraints.
/// Maps IDs to their descriptors for the logic engine.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed class PraxisRegistry<TContext>
{
    private readonly Dictionary<string, RuleDescriptor<TContext>> _rules = new();
    private readonly Dictionary<string, ConstraintDescriptor<TContext>> _constraints = new();

    /// <summary>
    /// Registers a rule in the registry.
    /// </summary>
    /// <param name="descriptor">The rule descriptor to register.</param>
    /// <exception cref="InvalidOperationException">Thrown if a rule with the same ID is already registered.</exception>
    public void RegisterRule(RuleDescriptor<TContext> descriptor)
    {
        if (_rules.ContainsKey(descriptor.Id))
        {
            throw new InvalidOperationException($"Rule with id \"{descriptor.Id}\" already registered");
        }

        _rules[descriptor.Id] = descriptor;
    }

    /// <summary>
    /// Registers a constraint in the registry.
    /// </summary>
    /// <param name="descriptor">The constraint descriptor to register.</param>
    /// <exception cref="InvalidOperationException">Thrown if a constraint with the same ID is already registered.</exception>
    public void RegisterConstraint(ConstraintDescriptor<TContext> descriptor)
    {
        if (_constraints.ContainsKey(descriptor.Id))
        {
            throw new InvalidOperationException($"Constraint with id \"{descriptor.Id}\" already registered");
        }

        _constraints[descriptor.Id] = descriptor;
    }

    /// <summary>
    /// Registers a module (all its rules and constraints).
    /// </summary>
    /// <param name="module">The module to register.</param>
    public void RegisterModule(PraxisModule<TContext> module)
    {
        foreach (var rule in module.Rules)
        {
            RegisterRule(rule);
        }

        foreach (var constraint in module.Constraints)
        {
            RegisterConstraint(constraint);
        }
    }

    /// <summary>
    /// Gets a rule by ID.
    /// </summary>
    /// <param name="id">The rule ID.</param>
    /// <returns>The rule descriptor, or null if not found.</returns>
    public RuleDescriptor<TContext>? GetRule(string id) =>
        _rules.TryGetValue(id, out var rule) ? rule : null;

    /// <summary>
    /// Gets a constraint by ID.
    /// </summary>
    /// <param name="id">The constraint ID.</param>
    /// <returns>The constraint descriptor, or null if not found.</returns>
    public ConstraintDescriptor<TContext>? GetConstraint(string id) =>
        _constraints.TryGetValue(id, out var constraint) ? constraint : null;

    /// <summary>
    /// Gets all registered rule IDs.
    /// </summary>
    /// <returns>A list of rule IDs.</returns>
    public IReadOnlyList<string> GetRuleIds() => _rules.Keys.ToList();

    /// <summary>
    /// Gets all registered constraint IDs.
    /// </summary>
    /// <returns>A list of constraint IDs.</returns>
    public IReadOnlyList<string> GetConstraintIds() => _constraints.Keys.ToList();

    /// <summary>
    /// Gets all registered rules.
    /// </summary>
    /// <returns>A list of rule descriptors.</returns>
    public IReadOnlyList<RuleDescriptor<TContext>> GetAllRules() => _rules.Values.ToList();

    /// <summary>
    /// Gets all registered constraints.
    /// </summary>
    /// <returns>A list of constraint descriptors.</returns>
    public IReadOnlyList<ConstraintDescriptor<TContext>> GetAllConstraints() => _constraints.Values.ToList();
}
