// <copyright file="SchemaRegistry.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

namespace Praxis.Core.PluresDB;

/// <summary>
/// A simplified Praxis schema definition.
/// </summary>
/// <param name="Name">The schema name.</param>
/// <param name="Version">The schema version.</param>
/// <param name="Description">Optional description.</param>
public sealed record PraxisSchema(
    string Name,
    string Version,
    string? Description = null);

/// <summary>
/// Stored schema entry with metadata.
/// </summary>
/// <param name="Schema">The schema definition.</param>
/// <param name="RegisteredAt">When the schema was registered.</param>
/// <param name="Version">Schema version.</param>
public sealed record StoredSchema(
    PraxisSchema Schema,
    long RegisteredAt,
    string Version);

/// <summary>
/// PraxisSchemaRegistry manages schema definitions in PluresDB.
/// Schemas are stored under /_praxis/schemas/schemaName.
/// </summary>
public sealed class PraxisSchemaRegistry
{
    private readonly IPraxisDB _db;

    /// <summary>
    /// Initializes a new instance of the <see cref="PraxisSchemaRegistry"/> class.
    /// </summary>
    /// <param name="db">The PraxisDB instance.</param>
    public PraxisSchemaRegistry(IPraxisDB db)
    {
        _db = db;
    }

    /// <summary>
    /// Gets the path for a schema in PluresDB.
    /// </summary>
    /// <param name="schemaName">The schema name.</param>
    /// <returns>The schema path.</returns>
    public static string GetSchemaPath(string schemaName) => $"{PraxisPaths.Schemas}/{schemaName}";

    /// <summary>
    /// Registers a schema in PluresDB.
    /// </summary>
    /// <param name="schema">The schema to register.</param>
    /// <returns>A task representing the async operation.</returns>
    public async Task RegisterAsync(PraxisSchema schema)
    {
        var path = GetSchemaPath(schema.Name);

        var storedSchema = new StoredSchema(
            Schema: schema,
            RegisteredAt: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Version: schema.Version);

        await _db.SetAsync(path, storedSchema);
    }

    /// <summary>
    /// Gets a schema by name.
    /// </summary>
    /// <param name="schemaName">The schema name.</param>
    /// <returns>The stored schema or null if not found.</returns>
    public async Task<StoredSchema?> GetAsync(string schemaName)
    {
        var path = GetSchemaPath(schemaName);
        return await _db.GetAsync<StoredSchema>(path);
    }

    /// <summary>
    /// Checks if a schema is registered.
    /// </summary>
    /// <param name="schemaName">The schema name.</param>
    /// <returns>True if the schema exists.</returns>
    public async Task<bool> ExistsAsync(string schemaName)
    {
        var stored = await GetAsync(schemaName);
        return stored != null;
    }

    /// <summary>
    /// Updates a schema (replaces existing).
    /// </summary>
    /// <param name="schema">The updated schema.</param>
    /// <returns>A task representing the async operation.</returns>
    public Task UpdateAsync(PraxisSchema schema) => RegisterAsync(schema);

    /// <summary>
    /// Lists all registered schema names.
    /// Implementation note: This method uses an index stored at /_praxis/schemas/_index.
    /// When using InMemoryPraxisDB, schemas must be registered using RegisterWithIndexAsync()
    /// for them to appear in this listing.
    /// </summary>
    /// <returns>Array of registered schema names.</returns>
    public async Task<IReadOnlyList<string>> ListAsync()
    {
        var indexPath = $"{PraxisPaths.Schemas}/_index";
        var index = await _db.GetAsync<List<string>>(indexPath);
        return index ?? [];
    }

    /// <summary>
    /// Registers a schema and updates the index.
    /// </summary>
    /// <param name="schema">The schema to register.</param>
    /// <returns>A task representing the async operation.</returns>
    public async Task RegisterWithIndexAsync(PraxisSchema schema)
    {
        // Register the schema
        await RegisterAsync(schema);

        // Update the index
        var indexPath = $"{PraxisPaths.Schemas}/_index";
        var existingIndex = await _db.GetAsync<List<string>>(indexPath) ?? [];

        if (!existingIndex.Contains(schema.Name))
        {
            existingIndex.Add(schema.Name);
            await _db.SetAsync(indexPath, existingIndex);
        }
    }
}

/// <summary>
/// Helper methods for schema registration.
/// </summary>
public static class SchemaRegistryHelper
{
    /// <summary>
    /// Registers a schema in PluresDB.
    /// Convenience function for one-off schema registration.
    /// </summary>
    /// <param name="db">The PraxisDB instance.</param>
    /// <param name="schema">The schema to register.</param>
    /// <returns>A task representing the async operation.</returns>
    /// <example>
    /// <code>
    /// var db = PraxisDBFactory.CreateInMemoryDB();
    /// await SchemaRegistryHelper.RegisterSchemaAsync(db, new PraxisSchema(
    ///     Name: "MyApp",
    ///     Version: "1.0.0",
    ///     Description: "My application schema"));
    /// </code>
    /// </example>
    public static async Task RegisterSchemaAsync(IPraxisDB db, PraxisSchema schema)
    {
        var registry = new PraxisSchemaRegistry(db);
        await registry.RegisterWithIndexAsync(schema);
    }

    /// <summary>
    /// Creates a PraxisSchemaRegistry instance.
    /// </summary>
    /// <param name="db">The PraxisDB instance.</param>
    /// <returns>PraxisSchemaRegistry instance.</returns>
    public static PraxisSchemaRegistry CreateSchemaRegistry(IPraxisDB db) => new(db);
}
