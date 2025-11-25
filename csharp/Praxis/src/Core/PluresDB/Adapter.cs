// <copyright file="Adapter.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Collections.Concurrent;

namespace Praxis.Core.PluresDB;

/// <summary>
/// Function to unsubscribe from a watch.
/// </summary>
public delegate void UnsubscribeFn();

/// <summary>
/// Core database interface for Praxis.
/// Provides a minimal API for get/set/watch operations.
/// Can be backed by in-memory storage or PluresDB.
/// </summary>
public interface IPraxisDB
{
    /// <summary>
    /// Gets a value by key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to retrieve.</param>
    /// <returns>The value or null if not found.</returns>
    Task<T?> GetAsync<T>(string key) where T : class;

    /// <summary>
    /// Sets a value by key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to set.</param>
    /// <param name="value">The value to store.</param>
    /// <returns>A task representing the async operation.</returns>
    Task SetAsync<T>(string key, T value);

    /// <summary>
    /// Watches a key for changes.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to watch.</param>
    /// <param name="callback">Called when the value changes.</param>
    /// <returns>Function to unsubscribe from updates.</returns>
    UnsubscribeFn Watch<T>(string key, Action<T> callback);
}

/// <summary>
/// In-memory implementation of IPraxisDB.
/// Provides a simple in-memory store for development and testing.
/// Suitable for proxying to PluresDB later.
/// </summary>
public sealed class InMemoryPraxisDB : IPraxisDB
{
    private readonly ConcurrentDictionary<string, object> _store = new();
    private readonly ConcurrentDictionary<string, HashSet<Action<object>>> _watchers = new();
    private readonly object _watcherLock = new();

    /// <summary>
    /// Gets a value by key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to retrieve.</param>
    /// <returns>The value or null if not found.</returns>
    public Task<T?> GetAsync<T>(string key) where T : class
    {
        if (_store.TryGetValue(key, out var value))
        {
            return Task.FromResult(value as T);
        }

        return Task.FromResult<T?>(null);
    }

    /// <summary>
    /// Sets a value by key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to set.</param>
    /// <param name="value">The value to store.</param>
    /// <returns>A task representing the async operation.</returns>
    public Task SetAsync<T>(string key, T value)
    {
        ArgumentNullException.ThrowIfNull(value);
        _store[key] = value;

        // Notify watchers
        if (_watchers.TryGetValue(key, out var keyWatchers))
        {
            lock (_watcherLock)
            {
                foreach (var callback in keyWatchers)
                {
                    callback(value);
                }
            }
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Watches a key for changes.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="key">The key to watch.</param>
    /// <param name="callback">Called when the value changes.</param>
    /// <returns>Function to unsubscribe from updates.</returns>
    public UnsubscribeFn Watch<T>(string key, Action<T> callback)
    {
        var wrappedCallback = (object val) => callback((T)val);

        lock (_watcherLock)
        {
            if (!_watchers.TryGetValue(key, out var watchers))
            {
                watchers = [];
                _watchers[key] = watchers;
            }

            watchers.Add(wrappedCallback);
        }

        // Return unsubscribe function
        return () =>
        {
            lock (_watcherLock)
            {
                if (_watchers.TryGetValue(key, out var watchers))
                {
                    watchers.Remove(wrappedCallback);
                    if (watchers.Count == 0)
                    {
                        _watchers.TryRemove(key, out _);
                    }
                }
            }
        };
    }

    /// <summary>
    /// Gets all keys (for testing/debugging).
    /// </summary>
    /// <returns>A list of all keys in the store.</returns>
    public IReadOnlyList<string> Keys() => _store.Keys.ToList();

    /// <summary>
    /// Clears all data (for testing).
    /// </summary>
    public void Clear()
    {
        _store.Clear();
        lock (_watcherLock)
        {
            _watchers.Clear();
        }
    }
}

/// <summary>
/// Factory methods for creating PraxisDB instances.
/// </summary>
public static class PraxisDBFactory
{
    /// <summary>
    /// Creates a new in-memory PraxisDB instance.
    /// </summary>
    /// <returns>InMemoryPraxisDB instance.</returns>
    /// <example>
    /// <code>
    /// var db = PraxisDBFactory.CreateInMemoryDB();
    /// await db.SetAsync("user:1", new { Name = "Alice" });
    /// var user = await db.GetAsync&lt;object&gt;("user:1");
    /// </code>
    /// </example>
    public static InMemoryPraxisDB CreateInMemoryDB() => new();
}
