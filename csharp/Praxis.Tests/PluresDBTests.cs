// <copyright file="PluresDBTests.cs" company="Plures">
// Copyright (c) Plures. All rights reserved.
// Licensed under the MIT License.
// </copyright>

using Praxis.Core;
using Praxis.Core.PluresDB;
using Praxis.Dsl;
using Xunit;

namespace Praxis.Tests;

public class PluresDBTests
{
    #region InMemoryPraxisDB Tests

    public class InMemoryPraxisDBTests
    {
        [Fact]
        public async Task GetSetAsync_ShouldGetAndSetValues()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();

            await db.SetAsync("test-key", new TestValue(42));
            var result = await db.GetAsync<TestValue>("test-key");

            Assert.NotNull(result);
            Assert.Equal(42, result.Value);
        }

        [Fact]
        public async Task GetAsync_ShouldReturnNullForMissingKeys()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();

            var result = await db.GetAsync<TestValue>("nonexistent");

            Assert.Null(result);
        }

        [Fact]
        public async Task Watch_ShouldNotifyOnChanges()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var values = new List<int>();

            db.Watch<int>("counter", val =>
            {
                values.Add(val);
            });

            await db.SetAsync("counter", 1);
            await db.SetAsync("counter", 2);
            await db.SetAsync("counter", 3);

            Assert.Equal([1, 2, 3], values);
        }

        [Fact]
        public async Task Watch_ShouldUnsubscribe()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var values = new List<int>();

            var unsubscribe = db.Watch<int>("counter", val =>
            {
                values.Add(val);
            });

            await db.SetAsync("counter", 1);
            unsubscribe();
            await db.SetAsync("counter", 2);

            Assert.Single(values);
            Assert.Equal(1, values[0]);
        }

        [Fact]
        public async Task Keys_ShouldListAllKeys()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();

            await db.SetAsync("key1", "value1");
            await db.SetAsync("key2", "value2");

            var keys = db.Keys();

            Assert.Contains("key1", keys);
            Assert.Contains("key2", keys);
        }

        [Fact]
        public async Task Clear_ShouldRemoveAllData()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();

            await db.SetAsync("key1", "value1");
            db.Clear();

            var result = await db.GetAsync<string>("key1");
            Assert.Null(result);
            Assert.Empty(db.Keys());
        }

        private sealed record TestValue(int Value);
    }

    #endregion

    #region Path Generator Tests

    public class PathGeneratorTests
    {
        [Fact]
        public void GetFactPath_ShouldGenerateCorrectPaths()
        {
            Assert.Equal("/_praxis/facts/UserLoggedIn", PraxisPaths.GetFactPath("UserLoggedIn"));
            Assert.Equal("/_praxis/facts/UserLoggedIn/user-123", PraxisPaths.GetFactPath("UserLoggedIn", "user-123"));
        }

        [Fact]
        public void GetEventPath_ShouldGenerateCorrectPaths()
        {
            Assert.Equal("/_praxis/events/LOGIN", PraxisPaths.GetEventPath("LOGIN"));
        }

        [Fact]
        public void GetSchemaPath_ShouldGenerateCorrectPaths()
        {
            Assert.Equal("/_praxis/schemas/MyApp", PraxisSchemaRegistry.GetSchemaPath("MyApp"));
        }

        [Fact]
        public void PraxisPaths_ShouldHaveCorrectValues()
        {
            Assert.Equal("/_praxis", PraxisPaths.Base);
            Assert.Equal("/_praxis/facts", PraxisPaths.Facts);
            Assert.Equal("/_praxis/events", PraxisPaths.Events);
            Assert.Equal("/_praxis/schemas", PraxisPaths.Schemas);
        }
    }

    #endregion

    #region PraxisDBStore Tests

    public class PraxisDBStoreTests
    {
        private record StoreTestContext(int Count = 0);

        [Fact]
        public async Task StoreFact_ShouldStoreFact()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var fact = PraxisFact.Create("UserLoggedIn", new { userId = "alice", id = "fact-1" });
            await store.StoreFactAsync(fact);

            var retrieved = await store.GetFactAsync("UserLoggedIn", "fact-1");

            Assert.NotNull(retrieved);
            Assert.Equal("UserLoggedIn", retrieved.Tag);
        }

        [Fact]
        public async Task StoreFacts_ShouldStoreMultipleFacts()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var facts = new[]
            {
                PraxisFact.Create("UserLoggedIn", new { userId = "alice", id = "fact-1" }),
                PraxisFact.Create("UserLoggedIn", new { userId = "bob", id = "fact-2" })
            };

            await store.StoreFactsAsync(facts);

            var fact1 = await store.GetFactAsync("UserLoggedIn", "fact-1");
            var fact2 = await store.GetFactAsync("UserLoggedIn", "fact-2");

            Assert.NotNull(fact1);
            Assert.NotNull(fact2);
        }

        [Fact]
        public async Task StoreFact_ShouldGenerateIdIfNotProvided()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var fact = PraxisFact.Create("UserLoggedIn", new { userId = "alice" });
            await store.StoreFactAsync(fact);

            // Check that something was stored under the UserLoggedIn path
            var keys = db.Keys().Where(k => k.StartsWith("/_praxis/facts/UserLoggedIn/")).ToList();
            Assert.Single(keys);
        }

        [Fact]
        public async Task AppendEvent_ShouldAppendEvent()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var @event = PraxisEvent.Create("LOGIN", new { username = "alice" });
            await store.AppendEventAsync(@event);

            var entries = await store.GetEventsAsync("LOGIN");

            Assert.Single(entries);
            Assert.Equal("LOGIN", entries[0].Event.Tag);
            Assert.Equal(0, entries[0].Sequence);
        }

        [Fact]
        public async Task AppendEvents_ShouldAppendMultipleEvents()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var events = new[]
            {
                PraxisEvent.Create("LOGIN", new { username = "alice" }),
                PraxisEvent.Create("LOGIN", new { username = "bob" })
            };

            await store.AppendEventsAsync(events);

            var entries = await store.GetEventsAsync("LOGIN");

            Assert.Equal(2, entries.Count);
        }

        [Fact]
        public async Task GetEvents_ShouldFilterByTimestamp()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            var event1 = PraxisEvent.Create("LOGIN", new { username = "alice" });
            await store.AppendEventAsync(event1);

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            // Small delay to ensure different timestamp
            await Task.Delay(10);

            var event2 = PraxisEvent.Create("LOGIN", new { username = "bob" });
            await store.AppendEventAsync(event2);

            var entries = await store.GetEventsAsync("LOGIN", since: timestamp);

            Assert.Single(entries);
        }

        [Fact]
        public async Task GetEvents_ShouldLimitResults()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            await store.AppendEventsAsync(
            [
                PraxisEvent.Create("LOGIN", new { username = "alice" }),
                PraxisEvent.Create("LOGIN", new { username = "bob" }),
                PraxisEvent.Create("LOGIN", new { username = "charlie" })
            ]);

            var entries = await store.GetEventsAsync("LOGIN", limit: 2);

            Assert.Equal(2, entries.Count);
        }

        [Fact]
        public async Task StoreFact_ShouldRejectViolatingConstraints()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();

            var noEmptyUserId = PraxisDsl.DefineConstraint<StoreTestContext>(
                id: "noEmptyUserId",
                description: "User ID cannot be empty",
                impl: (state, context) =>
                {
                    foreach (var fact in state.Facts)
                    {
                        var payload = fact.GetPayload<UserPayload>();
                        if (string.IsNullOrEmpty(payload?.UserId))
                        {
                            return ConstraintResult.Failure("User ID cannot be empty");
                        }
                    }

                    return ConstraintResult.Success;
                });

            registry.RegisterConstraint(noEmptyUserId);

            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);
            var invalidFact = PraxisFact.Create("UserLoggedIn", new { userId = "", id = "fact-1" });

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => store.StoreFactAsync(invalidFact));
            Assert.Contains("Constraint violation", ex.Message);
        }

        [Fact]
        public void Context_ShouldUpdateAndGetContext()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry, new StoreTestContext(0));

            Assert.Equal(0, store.GetContext().Count);

            store.UpdateContext(new StoreTestContext(5));

            Assert.Equal(5, store.GetContext().Count);
        }

        [Fact]
        public void Dispose_ShouldNotThrow()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<StoreTestContext>();
            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry);

            store.Dispose();
            // Should not throw
        }

        private sealed record UserPayload(string UserId, string? Id = null);
    }

    #endregion

    #region PraxisSchemaRegistry Tests

    public class PraxisSchemaRegistryTests
    {
        private static readonly PraxisSchema TestSchema = new(
            Name: "TestApp",
            Version: "1.0.0",
            Description: "Test application schema");

        [Fact]
        public async Task Register_ShouldRegisterSchema()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);

            await schemaRegistry.RegisterAsync(TestSchema);

            var stored = await schemaRegistry.GetAsync("TestApp");

            Assert.NotNull(stored);
            Assert.Equal("TestApp", stored.Schema.Name);
            Assert.Equal("1.0.0", stored.Version);
        }

        [Fact]
        public async Task Exists_ShouldCheckIfSchemaExists()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);

            Assert.False(await schemaRegistry.ExistsAsync("TestApp"));

            await schemaRegistry.RegisterAsync(TestSchema);

            Assert.True(await schemaRegistry.ExistsAsync("TestApp"));
        }

        [Fact]
        public async Task Update_ShouldUpdateSchema()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);

            await schemaRegistry.RegisterAsync(TestSchema);

            var updatedSchema = TestSchema with { Version = "2.0.0" };
            await schemaRegistry.UpdateAsync(updatedSchema);

            var stored = await schemaRegistry.GetAsync("TestApp");

            Assert.NotNull(stored);
            Assert.Equal("2.0.0", stored.Version);
        }

        [Fact]
        public async Task RegisterWithIndex_ShouldListSchemas()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);

            await schemaRegistry.RegisterWithIndexAsync(TestSchema);
            await schemaRegistry.RegisterWithIndexAsync(new PraxisSchema("OtherApp", "1.0.0"));

            var list = await schemaRegistry.ListAsync();

            Assert.Contains("TestApp", list);
            Assert.Contains("OtherApp", list);
        }

        [Fact]
        public async Task RegisterWithIndex_ShouldNotDuplicateInIndex()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);

            await schemaRegistry.RegisterWithIndexAsync(TestSchema);
            await schemaRegistry.RegisterWithIndexAsync(TestSchema);

            var list = await schemaRegistry.ListAsync();

            Assert.Single(list.Where(n => n == "TestApp"));
        }
    }

    #endregion

    #region RegisterSchema Helper Tests

    public class RegisterSchemaHelperTests
    {
        [Fact]
        public async Task RegisterSchemaAsync_ShouldRegisterWithConvenienceFunction()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();

            await SchemaRegistryHelper.RegisterSchemaAsync(db, new PraxisSchema(
                Name: "QuickApp",
                Version: "1.0.0"));

            var schemaRegistry = SchemaRegistryHelper.CreateSchemaRegistry(db);
            var stored = await schemaRegistry.GetAsync("QuickApp");

            Assert.NotNull(stored);
            Assert.Equal("QuickApp", stored.Schema.Name);
        }
    }

    #endregion

    #region Rules Triggering Tests

    public class RulesTriggingTests
    {
        private record AuthContext(int Logins = 0);

        [Fact]
        public async Task AppendEvent_ShouldTriggerRules()
        {
            var db = PraxisDBFactory.CreateInMemoryDB();
            var registry = new PraxisRegistry<AuthContext>();

            var UserLoggedIn = PraxisDsl.DefineFact<UserPayload>("UserLoggedIn");
            var Login = PraxisDsl.DefineEvent<LoginPayload>("LOGIN");

            var loginRule = PraxisDsl.DefineRule<AuthContext>(
                id: "auth.login",
                description: "Process login event",
                impl: (state, context, events) =>
                {
                    var loginEvent = events.FirstOrDefault(e => e.Tag == "LOGIN");
                    if (loginEvent != null)
                    {
                        var payload = Login.GetPayload(loginEvent);
                        return [UserLoggedIn.Create(new UserPayload(payload?.Username ?? "unknown"))];
                    }

                    return [];
                });

            registry.RegisterRule(loginRule);

            var store = PraxisDBStoreFactory.CreatePraxisDBStore(db, registry, new AuthContext());

            await store.AppendEventAsync(Login.Create(new LoginPayload("alice")));

            // Check that derived fact was stored
            var keys = db.Keys().Where(k => k.Contains("UserLoggedIn")).ToList();
            Assert.Single(keys);
        }

        private sealed record UserPayload(string UserId);
        private sealed record LoginPayload(string Username);
    }

    #endregion
}
