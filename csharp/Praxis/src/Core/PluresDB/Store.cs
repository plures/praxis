// <copyright file="Store.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text.Json;

namespace Praxis.Core.PluresDB;

/// <summary>
/// Key paths for Praxis data in PluresDB.
/// </summary>
public static class PraxisPaths
{
    /// <summary>
    /// Base path for all Praxis data.
    /// </summary>
    public const string Base = "/_praxis";

    /// <summary>
    /// Path for facts storage.
    /// </summary>
    public const string Facts = "/_praxis/facts";

    /// <summary>
    /// Path for events storage.
    /// </summary>
    public const string Events = "/_praxis/events";

    /// <summary>
    /// Path for schema registry.
    /// </summary>
    public const string Schemas = "/_praxis/schemas";

    /// <summary>
    /// Generates a fact key path.
    /// </summary>
    /// <param name="factTag">The fact type tag.</param>
    /// <param name="id">Optional unique identifier for the fact instance.</param>
    /// <returns>The fact path.</returns>
    public static string GetFactPath(string factTag, string? id = null) =>
        id != null ? $"{Facts}/{factTag}/{id}" : $"{Facts}/{factTag}";

    /// <summary>
    /// Generates an event stream key path.
    /// </summary>
    /// <param name="eventTag">The event type tag.</param>
    /// <returns>The event path.</returns>
    public static string GetEventPath(string eventTag) => $"{Events}/{eventTag}";
}

/// <summary>
/// Event stream entry with timestamp.
/// </summary>
/// <param name="Event">The event data.</param>
/// <param name="Timestamp">Timestamp when the event was appended.</param>
/// <param name="Sequence">Optional sequence number.</param>
public sealed record EventStreamEntry(
    PraxisEvent Event,
    long Timestamp,
    int? Sequence = null);

/// <summary>
/// Options for creating a PraxisDBStore.
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed record PraxisDBStoreOptions<TContext>
{
    /// <summary>
    /// Gets the PraxisDB instance to use.
    /// </summary>
    public required IPraxisDB Db { get; init; }

    /// <summary>
    /// Gets the PraxisRegistry for rules and constraints.
    /// </summary>
    public required PraxisRegistry<TContext> Registry { get; init; }

    /// <summary>
    /// Gets the initial context for rule evaluation.
    /// </summary>
    public TContext? InitialContext { get; init; }

    /// <summary>
    /// Gets the error handler for rule execution errors.
    /// </summary>
    public RuleErrorHandler? OnRuleError { get; init; }
}

/// <summary>
/// Error handler callback for rule execution errors.
/// </summary>
/// <param name="ruleId">The ID of the rule that failed.</param>
/// <param name="error">The exception that occurred.</param>
public delegate void RuleErrorHandler(string ruleId, Exception error);

/// <summary>
/// Generates a unique ID for facts or events.
/// Uses timestamp and random string for uniqueness.
/// </summary>
public static class IdGenerator
{
    private static readonly ThreadLocal<Random> RandomLocal = new(() => new Random());

    /// <summary>
    /// Generates a unique ID.
    /// </summary>
    /// <returns>A unique ID string.</returns>
    public static string GenerateId()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var random = RandomLocal.Value!.Next(0, int.MaxValue).ToString("x7");
        return $"{timestamp}-{random}";
    }
}

/// <summary>
/// PraxisDBStore manages persistence and reactive updates for Praxis state in PluresDB.
/// - Facts are stored as CRDT-backed documents under /_praxis/facts/factTag/id
/// - Events are stored as append-only streams under /_praxis/events/eventTag
/// - Rules are triggered automatically when watched keys change
/// - Constraints are run before writing mutated state
/// </summary>
/// <typeparam name="TContext">The type of the application context.</typeparam>
public sealed class PraxisDBStore<TContext>
{
    private readonly IPraxisDB _db;
    private readonly PraxisRegistry<TContext> _registry;
    private TContext _context;
    private readonly List<UnsubscribeFn> _subscriptions = [];
    private readonly Dictionary<string, HashSet<Action<IReadOnlyList<PraxisFact>>>> _factWatchers = new();
    private readonly RuleErrorHandler _onRuleError;

    /// <summary>
    /// Initializes a new instance of the <see cref="PraxisDBStore{TContext}"/> class.
    /// </summary>
    /// <param name="options">The store options.</param>
    public PraxisDBStore(PraxisDBStoreOptions<TContext> options)
    {
        _db = options.Db;
        _registry = options.Registry;
        _context = options.InitialContext ?? default!;
        _onRuleError = options.OnRuleError ?? DefaultErrorHandler;
    }

    private static void DefaultErrorHandler(string ruleId, Exception error)
    {
        // Default behavior: silent in production
        // Can be overridden via options.OnRuleError
    }

    /// <summary>
    /// Stores a fact in PluresDB.
    /// Facts are stored under /_praxis/facts/factTag/id.
    /// If no id is provided in the payload, a timestamp-based id is used.
    /// </summary>
    /// <param name="fact">The fact to store.</param>
    /// <returns>A task representing the async operation.</returns>
    /// <exception cref="InvalidOperationException">Thrown when a constraint is violated.</exception>
    public async Task StoreFactAsync(PraxisFact fact)
    {
        // Run constraints before storing
        var constraintResult = CheckConstraints([fact]);
        if (!constraintResult.IsValid)
        {
            throw new InvalidOperationException($"Constraint violation: {string.Join(", ", constraintResult.Errors)}");
        }

        await PersistFactAsync(fact);

        // Trigger rule evaluation - facts stored directly may trigger derived computations
        await TriggerRulesAsync([fact]);
    }

    /// <summary>
    /// Stores multiple facts in PluresDB.
    /// </summary>
    /// <param name="facts">The facts to store.</param>
    /// <returns>A task representing the async operation.</returns>
    /// <exception cref="InvalidOperationException">Thrown when a constraint is violated.</exception>
    public async Task StoreFactsAsync(IEnumerable<PraxisFact> facts)
    {
        var factList = facts.ToList();

        // Run constraints before storing
        var constraintResult = CheckConstraints(factList);
        if (!constraintResult.IsValid)
        {
            throw new InvalidOperationException($"Constraint violation: {string.Join(", ", constraintResult.Errors)}");
        }

        foreach (var fact in factList)
        {
            await PersistFactAsync(fact);
        }

        // Trigger rule evaluation
        await TriggerRulesAsync(factList);
    }

    private async Task PersistFactAsync(PraxisFact fact)
    {
        var id = GetIdFromPayload(fact.Payload) ?? IdGenerator.GenerateId();
        var path = PraxisPaths.GetFactPath(fact.Tag, id);
        await _db.SetAsync(path, fact);
    }

    private static string? GetIdFromPayload(JsonElement payload)
    {
        if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("id", out var idElement))
        {
            return idElement.GetString();
        }

        return null;
    }

    /// <summary>
    /// Gets a fact by tag and id.
    /// </summary>
    /// <param name="factTag">The fact type tag.</param>
    /// <param name="id">The fact id.</param>
    /// <returns>The fact or null if not found.</returns>
    public async Task<PraxisFact?> GetFactAsync(string factTag, string id)
    {
        var path = PraxisPaths.GetFactPath(factTag, id);
        return await _db.GetAsync<PraxisFact>(path);
    }

    /// <summary>
    /// Appends an event to the event stream.
    /// Events are stored as append-only streams under /_praxis/events/eventTag.
    /// </summary>
    /// <param name="event">The event to append.</param>
    /// <returns>A task representing the async operation.</returns>
    public async Task AppendEventAsync(PraxisEvent @event)
    {
        var path = PraxisPaths.GetEventPath(@event.Tag);

        // Get existing events for this tag
        var existingEvents = await _db.GetAsync<List<EventStreamEntry>>(path) ?? [];

        // Create new entry
        var entry = new EventStreamEntry(
            Event: @event,
            Timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Sequence: existingEvents.Count);

        // Append and store
        existingEvents.Add(entry);
        await _db.SetAsync(path, existingEvents);

        // Trigger rules with this event
        await TriggerRulesForEventsAsync([@event]);
    }

    /// <summary>
    /// Appends multiple events to their respective streams.
    /// </summary>
    /// <param name="events">The events to append.</param>
    /// <returns>A task representing the async operation.</returns>
    public async Task AppendEventsAsync(IEnumerable<PraxisEvent> events)
    {
        var eventList = events.ToList();

        // Group events by tag for efficient storage
        var eventsByTag = eventList
            .GroupBy(e => e.Tag)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Append each group
        foreach (var (tag, tagEvents) in eventsByTag)
        {
            var path = PraxisPaths.GetEventPath(tag);
            var existingEvents = await _db.GetAsync<List<EventStreamEntry>>(path) ?? [];
            var sequence = existingEvents.Count;

            foreach (var @event in tagEvents)
            {
                var entry = new EventStreamEntry(
                    Event: @event,
                    Timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    Sequence: sequence++);
                existingEvents.Add(entry);
            }

            await _db.SetAsync(path, existingEvents);
        }

        // Trigger rules
        await TriggerRulesForEventsAsync(eventList);
    }

    /// <summary>
    /// Gets events from a stream.
    /// </summary>
    /// <param name="eventTag">The event type tag.</param>
    /// <param name="since">Optional filter: only events after this timestamp.</param>
    /// <param name="limit">Optional filter: limit the number of events returned.</param>
    /// <returns>Array of event stream entries.</returns>
    public async Task<IReadOnlyList<EventStreamEntry>> GetEventsAsync(
        string eventTag,
        long? since = null,
        int? limit = null)
    {
        var path = PraxisPaths.GetEventPath(eventTag);
        var events = await _db.GetAsync<List<EventStreamEntry>>(path) ?? [];

        IEnumerable<EventStreamEntry> result = events;

        if (since.HasValue)
        {
            var sinceTimestamp = since.Value;
            result = result.Where(e => e.Timestamp > sinceTimestamp);
        }

        if (limit.HasValue)
        {
            result = result.TakeLast(limit.Value);
        }

        return result.ToList();
    }

    /// <summary>
    /// Watches a fact path for changes.
    /// </summary>
    /// <param name="factTag">The fact type tag to watch.</param>
    /// <param name="callback">Called when facts of this type change.</param>
    /// <returns>Unsubscribe function.</returns>
    public UnsubscribeFn WatchFacts(string factTag, Action<IReadOnlyList<PraxisFact>> callback)
    {
        var path = PraxisPaths.GetFactPath(factTag);

        // Register the callback
        if (!_factWatchers.TryGetValue(factTag, out var watchers))
        {
            watchers = [];
            _factWatchers[factTag] = watchers;
        }

        watchers.Add(callback);

        // Watch the path in the DB
        var unsubscribe = _db.Watch<PraxisFact>(path, fact =>
        {
            callback([fact]);
        });

        _subscriptions.Add(unsubscribe);

        return () =>
        {
            unsubscribe();
            _factWatchers[factTag]?.Remove(callback);
        };
    }

    private ConstraintCheckResult CheckConstraints(IReadOnlyList<PraxisFact> newFacts)
    {
        var constraints = _registry.GetAllConstraints();
        var errors = new List<string>();

        // Build a minimal state for constraint checking
        var state = PraxisState.Create(_context, newFacts);

        foreach (var constraint in constraints)
        {
            try
            {
                var result = constraint.Impl(state, _context);
                if (!result.IsValid)
                {
                    errors.Add(result.Message ?? $"Constraint \"{constraint.Id}\" violated");
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Error checking constraint \"{constraint.Id}\": {ex.Message}");
            }
        }

        return new ConstraintCheckResult(errors.Count == 0, errors);
    }

    private Task TriggerRulesAsync(IReadOnlyList<PraxisFact> newFacts)
    {
        // Rules are typically triggered by events, not facts
        // This method serves as a hook for derived fact computation
        // which can be implemented by subclasses or future enhancements
        return Task.CompletedTask;
    }

    private async Task TriggerRulesForEventsAsync(IReadOnlyList<PraxisEvent> events)
    {
        var rules = _registry.GetAllRules();

        // Build state for rule evaluation
        var state = PraxisState.Create(_context);

        // Execute each rule
        var derivedFacts = new List<PraxisFact>();
        foreach (var rule in rules)
        {
            try
            {
                var facts = rule.Impl(state, _context, events);
                derivedFacts.AddRange(facts);
            }
            catch (Exception ex)
            {
                _onRuleError(rule.Id, ex);
            }
        }

        // Store derived facts (without re-triggering rules to avoid infinite loops)
        if (derivedFacts.Count > 0)
        {
            var constraintResult = CheckConstraints(derivedFacts);
            if (constraintResult.IsValid)
            {
                foreach (var fact in derivedFacts)
                {
                    await PersistFactAsync(fact);
                }
            }
        }
    }

    /// <summary>
    /// Updates the context.
    /// </summary>
    /// <param name="context">The new context.</param>
    public void UpdateContext(TContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets the current context.
    /// </summary>
    /// <returns>The current context.</returns>
    public TContext GetContext() => _context;

    /// <summary>
    /// Disposes of all subscriptions.
    /// </summary>
    public void Dispose()
    {
        foreach (var unsubscribe in _subscriptions)
        {
            unsubscribe();
        }

        _subscriptions.Clear();
        _factWatchers.Clear();
    }
}

/// <summary>
/// Result of constraint checking.
/// </summary>
/// <param name="IsValid">True if all constraints passed.</param>
/// <param name="Errors">List of error messages.</param>
internal readonly record struct ConstraintCheckResult(
    bool IsValid,
    IReadOnlyList<string> Errors);

/// <summary>
/// Factory methods for creating PraxisDBStore instances.
/// </summary>
public static class PraxisDBStoreFactory
{
    /// <summary>
    /// Creates a new PraxisDBStore.
    /// </summary>
    /// <typeparam name="TContext">The type of the application context.</typeparam>
    /// <param name="db">The PraxisDB instance to use.</param>
    /// <param name="registry">The PraxisRegistry for rules and constraints.</param>
    /// <param name="initialContext">Optional initial context.</param>
    /// <param name="onRuleError">Optional error handler for rule execution errors.</param>
    /// <returns>PraxisDBStore instance.</returns>
    /// <example>
    /// <code>
    /// var db = PraxisDBFactory.CreateInMemoryDB();
    /// var registry = new PraxisRegistry&lt;MyContext&gt;();
    /// var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);
    ///
    /// await store.StoreFactAsync(PraxisFact.Create("UserLoggedIn", new { UserId = "alice" }));
    /// await store.AppendEventAsync(PraxisEvent.Create("LOGIN", new { Username = "alice" }));
    /// </code>
    /// </example>
    public static PraxisDBStore<TContext> CreatePraxisDBStore<TContext>(
        IPraxisDB db,
        PraxisRegistry<TContext> registry,
        TContext? initialContext = default,
        RuleErrorHandler? onRuleError = null) =>
        new(new PraxisDBStoreOptions<TContext>
        {
            Db = db,
            Registry = registry,
            InitialContext = initialContext,
            OnRuleError = onRuleError
        });
}
