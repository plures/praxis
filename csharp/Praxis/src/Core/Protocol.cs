// <copyright file="Protocol.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text.Json;
using System.Text.Json.Serialization;

namespace Praxis.Core;

/// <summary>
/// Protocol version following semantic versioning.
/// Must match the TypeScript protocol version for cross-language compatibility.
/// </summary>
public static class PraxisProtocol
{
    /// <summary>
    /// The current protocol version.
    /// </summary>
    public const string Version = "1.0.0";
}

/// <summary>
/// A fact is a typed proposition about the domain.
/// Facts are immutable records representing truths in the system.
/// Examples: UserLoggedIn, CartItem, NetworkOnline
/// </summary>
/// <param name="Tag">Tag identifying the fact type.</param>
/// <param name="Payload">Payload containing the fact data as a JSON element.</param>
public sealed record PraxisFact(
    [property: JsonPropertyName("tag")] string Tag,
    [property: JsonPropertyName("payload")] JsonElement Payload)
{
    /// <summary>
    /// Creates a fact with a typed payload.
    /// </summary>
    /// <typeparam name="T">The type of the payload.</typeparam>
    /// <param name="tag">The fact tag.</param>
    /// <param name="payload">The typed payload.</param>
    /// <returns>A new PraxisFact instance.</returns>
    public static PraxisFact Create<T>(string tag, T payload) =>
        new(tag, JsonSerializer.SerializeToElement(payload));

    /// <summary>
    /// Gets the payload as a typed object.
    /// </summary>
    /// <typeparam name="T">The type to deserialize to.</typeparam>
    /// <returns>The deserialized payload.</returns>
    public T? GetPayload<T>() => Payload.Deserialize<T>();
}

/// <summary>
/// An event is a temporally ordered fact meant to drive change.
/// Events trigger state transitions through rules.
/// Examples: LOGIN, LOGOUT, ADD_TO_CART
/// </summary>
/// <param name="Tag">Tag identifying the event type.</param>
/// <param name="Payload">Payload containing the event data as a JSON element.</param>
public sealed record PraxisEvent(
    [property: JsonPropertyName("tag")] string Tag,
    [property: JsonPropertyName("payload")] JsonElement Payload)
{
    /// <summary>
    /// Creates an event with a typed payload.
    /// </summary>
    /// <typeparam name="T">The type of the payload.</typeparam>
    /// <param name="tag">The event tag.</param>
    /// <param name="payload">The typed payload.</param>
    /// <returns>A new PraxisEvent instance.</returns>
    public static PraxisEvent Create<T>(string tag, T payload) =>
        new(tag, JsonSerializer.SerializeToElement(payload));

    /// <summary>
    /// Gets the payload as a typed object.
    /// </summary>
    /// <typeparam name="T">The type to deserialize to.</typeparam>
    /// <returns>The deserialized payload.</returns>
    public T? GetPayload<T>() => Payload.Deserialize<T>();
}

/// <summary>
/// The state of the Praxis engine at a point in time.
/// State is immutable - all transitions produce new state instances.
/// </summary>
/// <param name="Context">Application context (domain-specific data).</param>
/// <param name="Facts">Current facts about the domain.</param>
/// <param name="Meta">Optional metadata (timestamps, version, etc.).</param>
/// <param name="ProtocolVersion">Protocol version for cross-language compatibility.</param>
public sealed record PraxisState(
    [property: JsonPropertyName("context")] JsonElement Context,
    [property: JsonPropertyName("facts")] IReadOnlyList<PraxisFact> Facts,
    [property: JsonPropertyName("meta")] IReadOnlyDictionary<string, JsonElement>? Meta = null,
    [property: JsonPropertyName("protocolVersion")] string? ProtocolVersion = null)
{
    /// <summary>
    /// Creates a state with a typed context.
    /// </summary>
    /// <typeparam name="TContext">The type of the context.</typeparam>
    /// <param name="context">The typed context.</param>
    /// <param name="facts">Initial facts.</param>
    /// <param name="meta">Optional metadata.</param>
    /// <returns>A new PraxisState instance.</returns>
    public static PraxisState Create<TContext>(
        TContext context,
        IReadOnlyList<PraxisFact>? facts = null,
        IReadOnlyDictionary<string, JsonElement>? meta = null) =>
        new(
            JsonSerializer.SerializeToElement(context),
            facts ?? Array.Empty<PraxisFact>(),
            meta,
            PraxisProtocol.Version);

    /// <summary>
    /// Gets the context as a typed object.
    /// </summary>
    /// <typeparam name="TContext">The type to deserialize to.</typeparam>
    /// <returns>The deserialized context.</returns>
    public TContext? GetContext<TContext>() => Context.Deserialize<TContext>();

    /// <summary>
    /// Creates a new state with updated context.
    /// </summary>
    /// <typeparam name="TContext">The type of the context.</typeparam>
    /// <param name="context">The new context.</param>
    /// <returns>A new PraxisState instance.</returns>
    public PraxisState WithContext<TContext>(TContext context) =>
        this with { Context = JsonSerializer.SerializeToElement(context) };

    /// <summary>
    /// Creates a new state with additional facts.
    /// </summary>
    /// <param name="newFacts">Facts to add.</param>
    /// <returns>A new PraxisState instance.</returns>
    public PraxisState WithFacts(IEnumerable<PraxisFact> newFacts) =>
        this with { Facts = Facts.Concat(newFacts).ToList() };
}

/// <summary>
/// Diagnostic information about constraint violations or rule errors.
/// </summary>
/// <param name="Kind">Kind of diagnostic.</param>
/// <param name="Message">Human-readable message.</param>
/// <param name="Data">Additional diagnostic data.</param>
public sealed record PraxisDiagnostics(
    [property: JsonPropertyName("kind")] DiagnosticKind Kind,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("data")] JsonElement? Data = null);

/// <summary>
/// The kind of diagnostic.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DiagnosticKind
{
    /// <summary>
    /// A constraint was violated.
    /// </summary>
    [JsonPropertyName("constraint-violation")]
    ConstraintViolation,

    /// <summary>
    /// A rule execution error occurred.
    /// </summary>
    [JsonPropertyName("rule-error")]
    RuleError
}

/// <summary>
/// Configuration for a step execution.
/// Specifies which rules and constraints to apply.
/// </summary>
/// <param name="RuleIds">IDs of rules to apply during this step.</param>
/// <param name="ConstraintIds">IDs of constraints to check during this step.</param>
public sealed record PraxisStepConfig(
    [property: JsonPropertyName("ruleIds")] IReadOnlyList<string> RuleIds,
    [property: JsonPropertyName("constraintIds")] IReadOnlyList<string> ConstraintIds);

/// <summary>
/// Result of a step execution.
/// </summary>
/// <param name="State">New state after applying rules and checking constraints.</param>
/// <param name="Diagnostics">Diagnostics from rule execution and constraint checking.</param>
public sealed record PraxisStepResult(
    [property: JsonPropertyName("state")] PraxisState State,
    [property: JsonPropertyName("diagnostics")] IReadOnlyList<PraxisDiagnostics> Diagnostics);
