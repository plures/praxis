/**
 * Simple Todo App Schema
 *
 * Demonstrates the Praxis Golden Path:
 * Schema -> Logic -> Components -> Runtime
 */

export const schema = {
  version: '1.0.0',
  name: 'TodoApp',
  description: 'A simple todo application built with Praxis',

  models: [
    {
      name: 'Todo',
      description: 'Todo item model',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', optional: true },
        { name: 'completed', type: 'boolean' },
        { name: 'createdAt', type: 'date' },
      ],
      indexes: [{ name: 'completed_idx', fields: ['completed'] }],
    },
  ],

  components: [
    {
      name: 'TodoForm',
      type: 'form',
      description: 'Form for creating new todos',
      model: 'Todo',
    },
    {
      name: 'TodoList',
      type: 'list',
      description: 'List of all todos',
      model: 'Todo',
    },
    {
      name: 'TodoItem',
      type: 'display',
      description: 'Single todo item display',
      model: 'Todo',
    },
  ],

  logic: [
    {
      id: 'todo-logic',
      description: 'Todo management logic',

      events: [
        {
          tag: 'CREATE_TODO',
          payload: { title: 'string', description: 'string' },
          description: 'Create a new todo item',
        },
        {
          tag: 'COMPLETE_TODO',
          payload: { todoId: 'string' },
          description: 'Mark a todo as completed',
        },
        {
          tag: 'DELETE_TODO',
          payload: { todoId: 'string' },
          description: 'Delete a todo item',
        },
      ],

      facts: [
        {
          tag: 'TodoCreated',
          payload: { todoId: 'string', title: 'string' },
          description: 'A todo was created',
        },
        {
          tag: 'TodoCompleted',
          payload: { todoId: 'string' },
          description: 'A todo was marked as completed',
        },
        {
          tag: 'TodoDeleted',
          payload: { todoId: 'string' },
          description: 'A todo was deleted',
        },
      ],

      rules: [
        {
          id: 'todo.create',
          description: 'Create a new todo item',
          then: 'Generate a unique ID and create todo',
          priority: 10,
        },
        {
          id: 'todo.complete',
          description: 'Mark todo as completed',
          then: 'Update todo completed status',
          priority: 5,
        },
        {
          id: 'todo.delete',
          description: 'Delete a todo item',
          then: 'Remove todo from state',
          priority: 5,
        },
      ],

      constraints: [
        {
          id: 'todo.title-required',
          description: 'Todo title must not be empty',
          check: 'title.length > 0',
          message: 'Todo title is required',
        },
      ],
    },
  ],
};

export default schema;
