// <copyright file="DslTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using Praxis.Core;
using Praxis.Dsl;
using Xunit;

namespace Praxis.Tests;

public class DslTests
{
    private record TestContext(string? Value);
    private record TestPayload(string Id, int Count);
    private record LoginPayload(string Username);

    [Fact]
    public void DefineFact_ShouldCreateFactDefinition()
    {
        var TestFact = PraxisDsl.DefineFact<TestPayload>("TestFact");

        Assert.Equal("TestFact", TestFact.Tag);
    }

    [Fact]
    public void FactDefinition_Create_ShouldCreateFactWithPayload()
    {
        var TestFact = PraxisDsl.DefineFact<TestPayload>("TestFact");
        var payload = new TestPayload("123", 42);

        var fact = TestFact.Create(payload);

        Assert.Equal("TestFact", fact.Tag);
    }

    [Fact]
    public void FactDefinition_Is_ShouldMatchCorrectTag()
    {
        var TestFact = PraxisDsl.DefineFact<TestPayload>("TestFact");
        var OtherFact = PraxisDsl.DefineFact<TestPayload>("OtherFact");
        var fact = TestFact.Create(new TestPayload("123", 42));

        Assert.True(TestFact.Is(fact));
        Assert.False(OtherFact.Is(fact));
    }

    [Fact]
    public void FactDefinition_GetPayload_ShouldDeserializePayload()
    {
        var TestFact = PraxisDsl.DefineFact<TestPayload>("TestFact");
        var payload = new TestPayload("123", 42);
        var fact = TestFact.Create(payload);

        var retrieved = TestFact.GetPayload(fact);

        Assert.NotNull(retrieved);
        Assert.Equal("123", retrieved.Id);
        Assert.Equal(42, retrieved.Count);
    }

    [Fact]
    public void DefineEvent_ShouldCreateEventDefinition()
    {
        var TestEvent = PraxisDsl.DefineEvent<TestPayload>("TEST_EVENT");

        Assert.Equal("TEST_EVENT", TestEvent.Tag);
    }

    [Fact]
    public void EventDefinition_Create_ShouldCreateEventWithPayload()
    {
        var TestEvent = PraxisDsl.DefineEvent<TestPayload>("TEST_EVENT");
        var payload = new TestPayload("456", 100);

        var evt = TestEvent.Create(payload);

        Assert.Equal("TEST_EVENT", evt.Tag);
    }

    [Fact]
    public void EventDefinition_Is_ShouldMatchCorrectTag()
    {
        var TestEvent = PraxisDsl.DefineEvent<TestPayload>("TEST_EVENT");
        var OtherEvent = PraxisDsl.DefineEvent<TestPayload>("OTHER_EVENT");
        var evt = TestEvent.Create(new TestPayload("123", 42));

        Assert.True(TestEvent.Is(evt));
        Assert.False(OtherEvent.Is(evt));
    }

    [Fact]
    public void EventDefinition_GetPayload_ShouldDeserializePayload()
    {
        var TestEvent = PraxisDsl.DefineEvent<TestPayload>("TEST_EVENT");
        var payload = new TestPayload("789", 999);
        var evt = TestEvent.Create(payload);

        var retrieved = TestEvent.GetPayload(evt);

        Assert.NotNull(retrieved);
        Assert.Equal("789", retrieved.Id);
        Assert.Equal(999, retrieved.Count);
    }

    [Fact]
    public void DefineRule_ShouldCreateRuleDescriptor()
    {
        var rule = PraxisDsl.DefineRule<TestContext>(
            id: "test.rule",
            description: "Test rule description",
            impl: (state, context, events) => []);

        Assert.Equal("test.rule", rule.Id);
        Assert.Equal("Test rule description", rule.Description);
        Assert.NotNull(rule.Impl);
    }

    [Fact]
    public void DefineConstraint_ShouldCreateConstraintDescriptor()
    {
        var constraint = PraxisDsl.DefineConstraint<TestContext>(
            id: "test.constraint",
            description: "Test constraint description",
            impl: (state, context) => ConstraintResult.Success);

        Assert.Equal("test.constraint", constraint.Id);
        Assert.Equal("Test constraint description", constraint.Description);
        Assert.NotNull(constraint.Impl);
    }

    [Fact]
    public void DefineModule_ShouldCreateModuleWithRulesAndConstraints()
    {
        var rule = PraxisDsl.DefineRule<TestContext>(
            id: "test.rule",
            description: "Test rule",
            impl: (state, context, events) => []);

        var constraint = PraxisDsl.DefineConstraint<TestContext>(
            id: "test.constraint",
            description: "Test constraint",
            impl: (state, context) => true);

        var module = PraxisDsl.DefineModule<TestContext>(
            rules: [rule],
            constraints: [constraint],
            meta: new Dictionary<string, object> { ["version"] = "1.0.0" });

        Assert.Single(module.Rules);
        Assert.Single(module.Constraints);
        Assert.NotNull(module.Meta);
        Assert.Equal("1.0.0", module.Meta["version"]);
    }

    [Fact]
    public void FilterEvents_ShouldFilterByDefinition()
    {
        var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");
        var Logout = PraxisDsl.DefineEvent<object>("LOGOUT");

        var events = new List<PraxisEvent>
        {
            Login.Create(new LoginPayload("alice")),
            Logout.Create(new object()),
            Login.Create(new LoginPayload("bob"))
        };

        var filtered = events.FilterEvents(Login).ToList();

        Assert.Equal(2, filtered.Count);
        Assert.All(filtered, e => Assert.Equal("LOGIN", e.Tag));
    }

    [Fact]
    public void FilterFacts_ShouldFilterByDefinition()
    {
        var UserFact = PraxisDsl.DefineFact<TestPayload>("User");
        var OrderFact = PraxisDsl.DefineFact<TestPayload>("Order");

        var facts = new List<PraxisFact>
        {
            UserFact.Create(new TestPayload("1", 1)),
            OrderFact.Create(new TestPayload("2", 2)),
            UserFact.Create(new TestPayload("3", 3))
        };

        var filtered = facts.FilterFacts(UserFact).ToList();

        Assert.Equal(2, filtered.Count);
        Assert.All(filtered, f => Assert.Equal("User", f.Tag));
    }

    [Fact]
    public void FindEvent_ShouldFindFirstMatchingEvent()
    {
        var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");
        var events = new List<PraxisEvent>
        {
            PraxisEvent.Create("OTHER", new object()),
            Login.Create(new LoginPayload("alice")),
            Login.Create(new LoginPayload("bob"))
        };

        var found = events.FindEvent(Login);

        Assert.NotNull(found);
        Assert.Equal("LOGIN", found.Tag);
        var payload = Login.GetPayload(found);
        Assert.Equal("alice", payload?.Username);
    }

    [Fact]
    public void FindEvent_ShouldReturnNullIfNotFound()
    {
        var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");
        var events = new List<PraxisEvent>
        {
            PraxisEvent.Create("OTHER", new object())
        };

        var found = events.FindEvent(Login);

        Assert.Null(found);
    }

    [Fact]
    public void FindFact_ShouldFindFirstMatchingFact()
    {
        var UserFact = PraxisDsl.DefineFact<TestPayload>("User");
        var facts = new List<PraxisFact>
        {
            PraxisFact.Create("Other", new object()),
            UserFact.Create(new TestPayload("1", 10)),
            UserFact.Create(new TestPayload("2", 20))
        };

        var found = facts.FindFact(UserFact);

        Assert.NotNull(found);
        Assert.Equal("User", found.Tag);
        var payload = UserFact.GetPayload(found);
        Assert.Equal("1", payload?.Id);
    }

    [Fact]
    public void FindFact_ShouldReturnNullIfNotFound()
    {
        var UserFact = PraxisDsl.DefineFact<TestPayload>("User");
        var facts = new List<PraxisFact>
        {
            PraxisFact.Create("Other", new object())
        };

        var found = facts.FindFact(UserFact);

        Assert.Null(found);
    }
}
