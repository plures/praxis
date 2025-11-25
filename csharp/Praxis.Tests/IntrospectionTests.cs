// <copyright file="IntrospectionTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using Praxis.Core;
using Praxis.Dsl;
using Xunit;

namespace Praxis.Tests;

public class IntrospectionTests
{
    private record TestContext(string? Value);

    private static PraxisRegistry<TestContext> CreateTestRegistry()
    {
        var registry = new PraxisRegistry<TestContext>();

        registry.RegisterRule(PraxisDsl.DefineRule<TestContext>(
            id: "auth.login",
            description: "Process login events",
            impl: (state, context, events) => []));

        registry.RegisterRule(PraxisDsl.DefineRule<TestContext>(
            id: "auth.logout",
            description: "Process logout events",
            impl: (state, context, events) => []));

        registry.RegisterConstraint(PraxisDsl.DefineConstraint<TestContext>(
            id: "auth.required",
            description: "User must be authenticated",
            impl: (state, context) => true));

        registry.RegisterConstraint(PraxisDsl.DefineConstraint<TestContext>(
            id: "cart.maxItems",
            description: "Cart cannot exceed 100 items",
            impl: (state, context) => true));

        return registry;
    }

    [Fact]
    public void GetStats_ShouldReturnCorrectCounts()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var stats = introspector.GetStats();

        Assert.Equal(2, stats.RuleCount);
        Assert.Equal(2, stats.ConstraintCount);
    }

    [Fact]
    public void GetRuleInfo_ShouldReturnRuleDetails()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var info = introspector.GetRuleInfo("auth.login");

        Assert.NotNull(info);
        Assert.Equal("auth.login", info.Id);
        Assert.Equal("Process login events", info.Description);
    }

    [Fact]
    public void GetRuleInfo_ShouldReturnNullForUnknownId()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var info = introspector.GetRuleInfo("unknown.rule");

        Assert.Null(info);
    }

    [Fact]
    public void GetConstraintInfo_ShouldReturnConstraintDetails()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var info = introspector.GetConstraintInfo("auth.required");

        Assert.NotNull(info);
        Assert.Equal("auth.required", info.Id);
        Assert.Equal("User must be authenticated", info.Description);
    }

    [Fact]
    public void GetConstraintInfo_ShouldReturnNullForUnknownId()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var info = introspector.GetConstraintInfo("unknown.constraint");

        Assert.Null(info);
    }

    [Fact]
    public void SearchRules_ShouldFindMatchingRules()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var results = introspector.SearchRules("auth").ToList();

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Contains("auth", r.Id));
    }

    [Fact]
    public void SearchRules_ShouldBeCaseInsensitive()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var results = introspector.SearchRules("AUTH").ToList();

        Assert.Equal(2, results.Count);
    }

    [Fact]
    public void SearchRules_ShouldSearchDescription()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var results = introspector.SearchRules("login").ToList();

        Assert.Single(results);
        Assert.Equal("auth.login", results[0].Id);
    }

    [Fact]
    public void SearchConstraints_ShouldFindMatchingConstraints()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var results = introspector.SearchConstraints("auth").ToList();

        Assert.Single(results);
        Assert.Equal("auth.required", results[0].Id);
    }

    [Fact]
    public void GenerateSchema_ShouldIncludeAllRulesAndConstraints()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var schema = introspector.GenerateSchema(PraxisProtocol.Version);

        Assert.Equal(PraxisProtocol.Version, schema.ProtocolVersion);
        Assert.Equal(2, schema.Rules.Count);
        Assert.Equal(2, schema.Constraints.Count);
        Assert.All(schema.Rules, r => Assert.Equal("rule", r.Type));
        Assert.All(schema.Constraints, c => Assert.Equal("constraint", c.Type));
    }

    [Fact]
    public void GenerateGraph_ShouldIncludeAllNodes()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var graph = introspector.GenerateGraph();

        Assert.Equal(4, graph.Nodes.Count);
        Assert.Equal(2, graph.Nodes.Count(n => n.Type == "rule"));
        Assert.Equal(2, graph.Nodes.Count(n => n.Type == "constraint"));
    }

    [Fact]
    public void ExportDot_ShouldGenerateValidDotFormat()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var dot = introspector.ExportDot();

        Assert.Contains("digraph PraxisRegistry", dot);
        Assert.Contains("auth.login", dot);
        Assert.Contains("auth.required", dot);
        Assert.Contains("lightblue", dot);   // Rule color
        Assert.Contains("lightyellow", dot); // Constraint color
    }

    [Fact]
    public void ExportMermaid_ShouldGenerateValidMermaidFormat()
    {
        var registry = CreateTestRegistry();
        var introspector = Introspector.Create(registry);

        var mermaid = introspector.ExportMermaid();

        Assert.Contains("graph TD", mermaid);
        Assert.Contains("auth_login", mermaid); // Sanitized ID
        Assert.Contains("#add8e6", mermaid);   // Rule color
        Assert.Contains("#ffffe0", mermaid);   // Constraint color
    }
}
