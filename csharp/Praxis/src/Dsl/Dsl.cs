// <copyright file="Dsl.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text.Json;
using Praxis.Core;

namespace Praxis.Dsl;

/// <summary>
/// Strongly typed fact definition.
/// </summary>
/// <typeparam name="TTag">The tag type (must be a constant string type).</typeparam>
/// <typeparam name="TPayload">The payload type.</typeparam>
public sealed class FactDefinition<TTag, TPayload>
    where TTag : notnull
{
    /// <summary>
    /// Gets the tag identifying this fact type.
    /// </summary>
    public string Tag { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="FactDefinition{TTag, TPayload}"/> class.
    /// </summary>
    /// <param name="tag">The tag string.</param>
    public FactDefinition(string tag) => Tag = tag;

    /// <summary>
    /// Creates a new fact with the specified payload.
    /// </summary>
    /// <param name="payload">The fact payload.</param>
    /// <returns>A new PraxisFact instance.</returns>
    public PraxisFact Create(TPayload payload) => PraxisFact.Create(Tag, payload);

    /// <summary>
    /// Checks if a fact matches this definition.
    /// </summary>
    /// <param name="fact">The fact to check.</param>
    /// <returns>True if the fact matches this definition.</returns>
    public bool Is(PraxisFact fact) => fact.Tag == Tag;

    /// <summary>
    /// Gets the typed payload from a fact.
    /// </summary>
    /// <param name="fact">The fact to extract payload from.</param>
    /// <returns>The typed payload, or default if the fact doesn't match.</returns>
    public TPayload? GetPayload(PraxisFact fact) => Is(fact) ? fact.GetPayload<TPayload>() : default;
}

/// <summary>
/// Strongly typed event definition.
/// </summary>
/// <typeparam name="TTag">The tag type (must be a constant string type).</typeparam>
/// <typeparam name="TPayload">The payload type.</typeparam>
public sealed class EventDefinition<TTag, TPayload>
    where TTag : notnull
{
    /// <summary>
    /// Gets the tag identifying this event type.
    /// </summary>
    public string Tag { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="EventDefinition{TTag, TPayload}"/> class.
    /// </summary>
    /// <param name="tag">The tag string.</param>
    public EventDefinition(string tag) => Tag = tag;

    /// <summary>
    /// Creates a new event with the specified payload.
    /// </summary>
    /// <param name="payload">The event payload.</param>
    /// <returns>A new PraxisEvent instance.</returns>
    public PraxisEvent Create(TPayload payload) => PraxisEvent.Create(Tag, payload);

    /// <summary>
    /// Checks if an event matches this definition.
    /// </summary>
    /// <param name="evt">The event to check.</param>
    /// <returns>True if the event matches this definition.</returns>
    public bool Is(PraxisEvent evt) => evt.Tag == Tag;

    /// <summary>
    /// Gets the typed payload from an event.
    /// </summary>
    /// <param name="evt">The event to extract payload from.</param>
    /// <returns>The typed payload, or default if the event doesn't match.</returns>
    public TPayload? GetPayload(PraxisEvent evt) => Is(evt) ? evt.GetPayload<TPayload>() : default;
}

/// <summary>
/// DSL helper methods for defining Praxis primitives.
/// </summary>
public static class PraxisDsl
{
    /// <summary>
    /// Defines a typed fact.
    /// </summary>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="tag">The fact tag.</param>
    /// <returns>A new FactDefinition instance.</returns>
    /// <example>
    /// <code>
    /// var UserLoggedIn = PraxisDsl.DefineFact&lt;UserPayload&gt;("UserLoggedIn");
    /// var fact = UserLoggedIn.Create(new UserPayload { UserId = "123" });
    /// </code>
    /// </example>
    public static FactDefinition<string, TPayload> DefineFact<TPayload>(string tag) =>
        new(tag);

    /// <summary>
    /// Defines a typed event.
    /// </summary>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="tag">The event tag.</param>
    /// <returns>A new EventDefinition instance.</returns>
    /// <example>
    /// <code>
    /// var Login = PraxisDsl.DefineEvent&lt;LoginPayload&gt;("LOGIN");
    /// var evt = Login.Create(new LoginPayload { Username = "alice" });
    /// </code>
    /// </example>
    public static EventDefinition<string, TPayload> DefineEvent<TPayload>(string tag) =>
        new(tag);

    /// <summary>
    /// Defines a rule.
    /// </summary>
    /// <typeparam name="TContext">The context type.</typeparam>
    /// <param name="id">The rule ID.</param>
    /// <param name="description">The rule description.</param>
    /// <param name="impl">The rule implementation.</param>
    /// <param name="meta">Optional metadata.</param>
    /// <returns>A new RuleDescriptor instance.</returns>
    public static RuleDescriptor<TContext> DefineRule<TContext>(
        string id,
        string description,
        RuleFn<TContext> impl,
        IReadOnlyDictionary<string, object>? meta = null) =>
        new()
        {
            Id = id,
            Description = description,
            Impl = impl,
            Meta = meta
        };

    /// <summary>
    /// Defines a constraint.
    /// </summary>
    /// <typeparam name="TContext">The context type.</typeparam>
    /// <param name="id">The constraint ID.</param>
    /// <param name="description">The constraint description.</param>
    /// <param name="impl">The constraint implementation.</param>
    /// <param name="meta">Optional metadata.</param>
    /// <returns>A new ConstraintDescriptor instance.</returns>
    public static ConstraintDescriptor<TContext> DefineConstraint<TContext>(
        string id,
        string description,
        ConstraintFn<TContext> impl,
        IReadOnlyDictionary<string, object>? meta = null) =>
        new()
        {
            Id = id,
            Description = description,
            Impl = impl,
            Meta = meta
        };

    /// <summary>
    /// Defines a module (bundle of rules and constraints).
    /// </summary>
    /// <typeparam name="TContext">The context type.</typeparam>
    /// <param name="rules">The rules in this module.</param>
    /// <param name="constraints">The constraints in this module.</param>
    /// <param name="meta">Optional metadata.</param>
    /// <returns>A new PraxisModule instance.</returns>
    public static PraxisModule<TContext> DefineModule<TContext>(
        IReadOnlyList<RuleDescriptor<TContext>>? rules = null,
        IReadOnlyList<ConstraintDescriptor<TContext>>? constraints = null,
        IReadOnlyDictionary<string, object>? meta = null) =>
        new()
        {
            Rules = rules ?? [],
            Constraints = constraints ?? [],
            Meta = meta
        };
}

/// <summary>
/// Extension methods for filtering and finding events and facts.
/// </summary>
public static class PraxisExtensions
{
    /// <summary>
    /// Filters events by definition.
    /// </summary>
    /// <typeparam name="TTag">The tag type.</typeparam>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="events">The events to filter.</param>
    /// <param name="definition">The event definition to filter by.</param>
    /// <returns>Filtered events matching the definition.</returns>
    public static IEnumerable<PraxisEvent> FilterEvents<TTag, TPayload>(
        this IEnumerable<PraxisEvent> events,
        EventDefinition<TTag, TPayload> definition)
        where TTag : notnull =>
        events.Where(definition.Is);

    /// <summary>
    /// Filters facts by definition.
    /// </summary>
    /// <typeparam name="TTag">The tag type.</typeparam>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="facts">The facts to filter.</param>
    /// <param name="definition">The fact definition to filter by.</param>
    /// <returns>Filtered facts matching the definition.</returns>
    public static IEnumerable<PraxisFact> FilterFacts<TTag, TPayload>(
        this IEnumerable<PraxisFact> facts,
        FactDefinition<TTag, TPayload> definition)
        where TTag : notnull =>
        facts.Where(definition.Is);

    /// <summary>
    /// Finds the first event matching the definition.
    /// </summary>
    /// <typeparam name="TTag">The tag type.</typeparam>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="events">The events to search.</param>
    /// <param name="definition">The event definition to find.</param>
    /// <returns>The first matching event, or null if not found.</returns>
    public static PraxisEvent? FindEvent<TTag, TPayload>(
        this IEnumerable<PraxisEvent> events,
        EventDefinition<TTag, TPayload> definition)
        where TTag : notnull =>
        events.FirstOrDefault(definition.Is);

    /// <summary>
    /// Finds the first fact matching the definition.
    /// </summary>
    /// <typeparam name="TTag">The tag type.</typeparam>
    /// <typeparam name="TPayload">The payload type.</typeparam>
    /// <param name="facts">The facts to search.</param>
    /// <param name="definition">The fact definition to find.</param>
    /// <returns>The first matching fact, or null if not found.</returns>
    public static PraxisFact? FindFact<TTag, TPayload>(
        this IEnumerable<PraxisFact> facts,
        FactDefinition<TTag, TPayload> definition)
        where TTag : notnull =>
        facts.FirstOrDefault(definition.Is);
}
