// <copyright file="Introspection.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using System.Text;

namespace Praxis.Core;

/// <summary>
/// Statistics about a registry.
/// </summary>
/// <param name="RuleCount">Number of rules registered.</param>
/// <param name="ConstraintCount">Number of constraints registered.</param>
public sealed record RegistryStats(int RuleCount, int ConstraintCount);

/// <summary>
/// Information about a rule for introspection.
/// </summary>
/// <param name="Id">The rule ID.</param>
/// <param name="Description">The rule description.</param>
/// <param name="Meta">Optional metadata.</param>
public sealed record RuleInfo(string Id, string Description, IReadOnlyDictionary<string, object>? Meta);

/// <summary>
/// Information about a constraint for introspection.
/// </summary>
/// <param name="Id">The constraint ID.</param>
/// <param name="Description">The constraint description.</param>
/// <param name="Meta">Optional metadata.</param>
public sealed record ConstraintInfo(string Id, string Description, IReadOnlyDictionary<string, object>? Meta);

/// <summary>
/// Schema representation of a rule for JSON export.
/// </summary>
/// <param name="Id">The rule ID.</param>
/// <param name="Description">The rule description.</param>
/// <param name="Type">Always "rule".</param>
public sealed record RuleSchema(string Id, string Description, string Type = "rule");

/// <summary>
/// Schema representation of a constraint for JSON export.
/// </summary>
/// <param name="Id">The constraint ID.</param>
/// <param name="Description">The constraint description.</param>
/// <param name="Type">Always "constraint".</param>
public sealed record ConstraintSchema(string Id, string Description, string Type = "constraint");

/// <summary>
/// Schema representation of a registry.
/// </summary>
/// <param name="ProtocolVersion">The protocol version.</param>
/// <param name="Rules">The rules in the registry.</param>
/// <param name="Constraints">The constraints in the registry.</param>
public sealed record RegistrySchema(
    string ProtocolVersion,
    IReadOnlyList<RuleSchema> Rules,
    IReadOnlyList<ConstraintSchema> Constraints);

/// <summary>
/// A node in the registry graph.
/// </summary>
/// <param name="Id">The node ID.</param>
/// <param name="Type">The node type ("rule" or "constraint").</param>
/// <param name="Description">The node description.</param>
public sealed record GraphNode(string Id, string Type, string Description);

/// <summary>
/// An edge in the registry graph.
/// </summary>
/// <param name="From">The source node ID.</param>
/// <param name="To">The target node ID.</param>
/// <param name="Type">The edge type.</param>
public sealed record GraphEdge(string From, string To, string Type);

/// <summary>
/// A graph representation of a registry.
/// </summary>
/// <param name="Nodes">The nodes in the graph.</param>
/// <param name="Edges">The edges in the graph.</param>
public sealed record RegistryGraph(IReadOnlyList<GraphNode> Nodes, IReadOnlyList<GraphEdge> Edges);

/// <summary>
/// Provides introspection capabilities for a Praxis registry.
/// </summary>
/// <typeparam name="TContext">The context type.</typeparam>
public sealed class RegistryIntrospector<TContext>
{
    private readonly PraxisRegistry<TContext> _registry;

    /// <summary>
    /// Initializes a new instance of the <see cref="RegistryIntrospector{TContext}"/> class.
    /// </summary>
    /// <param name="registry">The registry to introspect.</param>
    public RegistryIntrospector(PraxisRegistry<TContext> registry)
    {
        _registry = registry;
    }

    /// <summary>
    /// Gets statistics about the registry.
    /// </summary>
    /// <returns>Registry statistics.</returns>
    public RegistryStats GetStats() =>
        new(RuleCount: _registry.GetRuleIds().Count, ConstraintCount: _registry.GetConstraintIds().Count);

    /// <summary>
    /// Gets information about a specific rule.
    /// </summary>
    /// <param name="id">The rule ID.</param>
    /// <returns>Rule information, or null if not found.</returns>
    public RuleInfo? GetRuleInfo(string id)
    {
        var rule = _registry.GetRule(id);
        return rule == null ? null : new RuleInfo(rule.Id, rule.Description, rule.Meta);
    }

    /// <summary>
    /// Gets information about a specific constraint.
    /// </summary>
    /// <param name="id">The constraint ID.</param>
    /// <returns>Constraint information, or null if not found.</returns>
    public ConstraintInfo? GetConstraintInfo(string id)
    {
        var constraint = _registry.GetConstraint(id);
        return constraint == null ? null : new ConstraintInfo(constraint.Id, constraint.Description, constraint.Meta);
    }

    /// <summary>
    /// Searches for rules matching a query.
    /// </summary>
    /// <param name="query">The search query.</param>
    /// <returns>Matching rule information.</returns>
    public IEnumerable<RuleInfo> SearchRules(string query)
    {
        var lowerQuery = query.ToLowerInvariant();
        return _registry.GetAllRules()
            .Where(r => r.Id.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase) ||
                       r.Description.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase))
            .Select(r => new RuleInfo(r.Id, r.Description, r.Meta));
    }

    /// <summary>
    /// Searches for constraints matching a query.
    /// </summary>
    /// <param name="query">The search query.</param>
    /// <returns>Matching constraint information.</returns>
    public IEnumerable<ConstraintInfo> SearchConstraints(string query)
    {
        var lowerQuery = query.ToLowerInvariant();
        return _registry.GetAllConstraints()
            .Where(c => c.Id.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase) ||
                       c.Description.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase))
            .Select(c => new ConstraintInfo(c.Id, c.Description, c.Meta));
    }

    /// <summary>
    /// Generates a JSON schema representation of the registry.
    /// </summary>
    /// <param name="protocolVersion">The protocol version to include.</param>
    /// <returns>The registry schema.</returns>
    public RegistrySchema GenerateSchema(string protocolVersion)
    {
        var rules = _registry.GetAllRules()
            .Select(r => new RuleSchema(r.Id, r.Description))
            .ToList();
        var constraints = _registry.GetAllConstraints()
            .Select(c => new ConstraintSchema(c.Id, c.Description))
            .ToList();
        return new RegistrySchema(protocolVersion, rules, constraints);
    }

    /// <summary>
    /// Generates a graph representation of the registry.
    /// </summary>
    /// <returns>The registry graph.</returns>
    public RegistryGraph GenerateGraph()
    {
        var nodes = new List<GraphNode>();

        foreach (var rule in _registry.GetAllRules())
        {
            nodes.Add(new GraphNode(rule.Id, "rule", rule.Description));
        }

        foreach (var constraint in _registry.GetAllConstraints())
        {
            nodes.Add(new GraphNode(constraint.Id, "constraint", constraint.Description));
        }

        // For now, edges are empty as we don't have explicit dependency tracking
        // This could be extended to track rule dependencies
        return new RegistryGraph(nodes, []);
    }

    /// <summary>
    /// Exports the registry to Graphviz DOT format.
    /// </summary>
    /// <returns>A DOT format string.</returns>
    public string ExportDot()
    {
        var sb = new StringBuilder();
        sb.AppendLine("digraph PraxisRegistry {");
        sb.AppendLine("  rankdir=TB;");
        sb.AppendLine("  node [shape=box];");
        sb.AppendLine();

        // Add rule nodes
        sb.AppendLine("  // Rules");
        foreach (var rule in _registry.GetAllRules())
        {
            var label = EscapeForDot(rule.Description);
            sb.AppendLine($"  \"{rule.Id}\" [label=\"{label}\", style=filled, fillcolor=lightblue];");
        }

        sb.AppendLine();

        // Add constraint nodes
        sb.AppendLine("  // Constraints");
        foreach (var constraint in _registry.GetAllConstraints())
        {
            var label = EscapeForDot(constraint.Description);
            sb.AppendLine($"  \"{constraint.Id}\" [label=\"{label}\", style=filled, fillcolor=lightyellow];");
        }

        sb.AppendLine("}");
        return sb.ToString();
    }

    /// <summary>
    /// Exports the registry to Mermaid diagram format.
    /// </summary>
    /// <returns>A Mermaid format string.</returns>
    public string ExportMermaid()
    {
        var sb = new StringBuilder();
        sb.AppendLine("graph TD");

        // Add rule nodes
        foreach (var rule in _registry.GetAllRules())
        {
            var safeId = SanitizeId(rule.Id);
            var label = EscapeForMermaid(rule.Description);
            sb.AppendLine($"  {safeId}[\"{label}\"]");
            sb.AppendLine($"  style {safeId} fill:#add8e6");
        }

        // Add constraint nodes
        foreach (var constraint in _registry.GetAllConstraints())
        {
            var safeId = SanitizeId(constraint.Id);
            var label = EscapeForMermaid(constraint.Description);
            sb.AppendLine($"  {safeId}{{{{\"{label}\"}}}}");
            sb.AppendLine($"  style {safeId} fill:#ffffe0");
        }

        return sb.ToString();
    }

    private static string EscapeForDot(string text) =>
        text.Replace("\"", "\\\"").Replace("\n", "\\n");

    private static string EscapeForMermaid(string text) =>
        text.Replace("\"", "&quot;").Replace("\n", " ");

    private static string SanitizeId(string id) =>
        id.Replace(".", "_").Replace("-", "_").Replace(" ", "_");
}

/// <summary>
/// Factory methods for creating registry introspectors.
/// </summary>
public static class Introspector
{
    /// <summary>
    /// Creates a new registry introspector.
    /// </summary>
    /// <typeparam name="TContext">The context type.</typeparam>
    /// <param name="registry">The registry to introspect.</param>
    /// <returns>A new RegistryIntrospector instance.</returns>
    public static RegistryIntrospector<TContext> Create<TContext>(PraxisRegistry<TContext> registry) =>
        new(registry);
}
