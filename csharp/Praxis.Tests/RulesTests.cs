// <copyright file="RulesTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using Praxis.Core;
using Xunit;

namespace Praxis.Tests;

public class RulesTests
{
    private record TestContext(string? CurrentUser);

    [Fact]
    public void ConstraintResult_Success_ShouldBeValid()
    {
        var result = ConstraintResult.Success;

        Assert.True(result.IsValid);
        Assert.Null(result.Message);
    }

    [Fact]
    public void ConstraintResult_Failure_ShouldBeInvalidWithMessage()
    {
        var result = ConstraintResult.Failure("Test failure");

        Assert.False(result.IsValid);
        Assert.Equal("Test failure", result.Message);
    }

    [Fact]
    public void ConstraintResult_ImplicitBoolConversion_ShouldWork()
    {
        ConstraintResult successResult = true;
        ConstraintResult failResult = false;

        Assert.True(successResult.IsValid);
        Assert.False(failResult.IsValid);
    }

    [Fact]
    public void ConstraintResult_ImplicitStringConversion_ShouldCreateFailure()
    {
        ConstraintResult result = "Error message";

        Assert.False(result.IsValid);
        Assert.Equal("Error message", result.Message);
    }

    [Fact]
    public void RuleDescriptor_ShouldStoreAllProperties()
    {
        var rule = new RuleDescriptor<TestContext>
        {
            Id = "test.rule",
            Description = "Test rule",
            Impl = (state, context, events) => [],
            Meta = new Dictionary<string, object> { ["version"] = "1.0" }
        };

        Assert.Equal("test.rule", rule.Id);
        Assert.Equal("Test rule", rule.Description);
        Assert.NotNull(rule.Impl);
        Assert.NotNull(rule.Meta);
        Assert.Equal("1.0", rule.Meta["version"]);
    }

    [Fact]
    public void ConstraintDescriptor_ShouldStoreAllProperties()
    {
        var constraint = new ConstraintDescriptor<TestContext>
        {
            Id = "test.constraint",
            Description = "Test constraint",
            Impl = (state, context) => ConstraintResult.Success
        };

        Assert.Equal("test.constraint", constraint.Id);
        Assert.Equal("Test constraint", constraint.Description);
        Assert.NotNull(constraint.Impl);
    }

    [Fact]
    public void PraxisModule_ShouldBundleRulesAndConstraints()
    {
        var rule = new RuleDescriptor<TestContext>
        {
            Id = "test.rule",
            Description = "Test rule",
            Impl = (state, context, events) => []
        };

        var constraint = new ConstraintDescriptor<TestContext>
        {
            Id = "test.constraint",
            Description = "Test constraint",
            Impl = (state, context) => true
        };

        var module = new PraxisModule<TestContext>
        {
            Rules = [rule],
            Constraints = [constraint],
            Meta = new Dictionary<string, object> { ["version"] = "1.0.0" }
        };

        Assert.Single(module.Rules);
        Assert.Single(module.Constraints);
        Assert.NotNull(module.Meta);
    }

    [Fact]
    public void PraxisRegistry_RegisterRule_ShouldAddRule()
    {
        var registry = new PraxisRegistry<TestContext>();
        var rule = new RuleDescriptor<TestContext>
        {
            Id = "test.rule",
            Description = "Test rule",
            Impl = (state, context, events) => []
        };

        registry.RegisterRule(rule);

        Assert.Single(registry.GetRuleIds());
        Assert.Equal("test.rule", registry.GetRuleIds()[0]);
    }

    [Fact]
    public void PraxisRegistry_RegisterRule_ShouldThrowOnDuplicate()
    {
        var registry = new PraxisRegistry<TestContext>();
        var rule = new RuleDescriptor<TestContext>
        {
            Id = "test.rule",
            Description = "Test rule",
            Impl = (state, context, events) => []
        };

        registry.RegisterRule(rule);

        var ex = Assert.Throws<InvalidOperationException>(() => registry.RegisterRule(rule));
        Assert.Contains("already registered", ex.Message);
    }

    [Fact]
    public void PraxisRegistry_RegisterConstraint_ShouldAddConstraint()
    {
        var registry = new PraxisRegistry<TestContext>();
        var constraint = new ConstraintDescriptor<TestContext>
        {
            Id = "test.constraint",
            Description = "Test constraint",
            Impl = (state, context) => true
        };

        registry.RegisterConstraint(constraint);

        Assert.Single(registry.GetConstraintIds());
        Assert.Equal("test.constraint", registry.GetConstraintIds()[0]);
    }

    [Fact]
    public void PraxisRegistry_RegisterConstraint_ShouldThrowOnDuplicate()
    {
        var registry = new PraxisRegistry<TestContext>();
        var constraint = new ConstraintDescriptor<TestContext>
        {
            Id = "test.constraint",
            Description = "Test constraint",
            Impl = (state, context) => true
        };

        registry.RegisterConstraint(constraint);

        var ex = Assert.Throws<InvalidOperationException>(() => registry.RegisterConstraint(constraint));
        Assert.Contains("already registered", ex.Message);
    }

    [Fact]
    public void PraxisRegistry_RegisterModule_ShouldAddAllRulesAndConstraints()
    {
        var registry = new PraxisRegistry<TestContext>();
        var module = new PraxisModule<TestContext>
        {
            Rules =
            [
                new RuleDescriptor<TestContext>
                {
                    Id = "rule1",
                    Description = "Rule 1",
                    Impl = (state, context, events) => []
                },
                new RuleDescriptor<TestContext>
                {
                    Id = "rule2",
                    Description = "Rule 2",
                    Impl = (state, context, events) => []
                }
            ],
            Constraints =
            [
                new ConstraintDescriptor<TestContext>
                {
                    Id = "constraint1",
                    Description = "Constraint 1",
                    Impl = (state, context) => true
                }
            ]
        };

        registry.RegisterModule(module);

        Assert.Equal(2, registry.GetRuleIds().Count);
        Assert.Single(registry.GetConstraintIds());
    }

    [Fact]
    public void PraxisRegistry_GetRule_ShouldReturnNullForUnknownId()
    {
        var registry = new PraxisRegistry<TestContext>();

        var rule = registry.GetRule("unknown");

        Assert.Null(rule);
    }

    [Fact]
    public void PraxisRegistry_GetConstraint_ShouldReturnNullForUnknownId()
    {
        var registry = new PraxisRegistry<TestContext>();

        var constraint = registry.GetConstraint("unknown");

        Assert.Null(constraint);
    }

    [Fact]
    public void PraxisRegistry_GetAllRules_ShouldReturnAllRegisteredRules()
    {
        var registry = new PraxisRegistry<TestContext>();
        registry.RegisterRule(new RuleDescriptor<TestContext>
        {
            Id = "rule1",
            Description = "Rule 1",
            Impl = (state, context, events) => []
        });
        registry.RegisterRule(new RuleDescriptor<TestContext>
        {
            Id = "rule2",
            Description = "Rule 2",
            Impl = (state, context, events) => []
        });

        var rules = registry.GetAllRules();

        Assert.Equal(2, rules.Count);
    }

    [Fact]
    public void PraxisRegistry_GetAllConstraints_ShouldReturnAllRegisteredConstraints()
    {
        var registry = new PraxisRegistry<TestContext>();
        registry.RegisterConstraint(new ConstraintDescriptor<TestContext>
        {
            Id = "constraint1",
            Description = "Constraint 1",
            Impl = (state, context) => true
        });

        var constraints = registry.GetAllConstraints();

        Assert.Single(constraints);
    }
}
