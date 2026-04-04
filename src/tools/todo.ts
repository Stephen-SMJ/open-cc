import { z } from 'zod';
import type { ToolDef } from './base.js';
import { TodoStore } from '../todos/store.js';
import type { TodoStatus } from '../todos/types.js';

const createSchema = z.object({
  items: z.array(z.string()).describe('List of todo item titles'),
});

const updateSchema = z.object({
  id: z.string().describe('The id of the todo item to update'),
  status: z.enum(['pending', 'in_progress', 'done', 'failed']).describe('New status'),
});

export function makeTodoTools(store: TodoStore) {
  const TodoListCreate: ToolDef<typeof createSchema> = {
    name: 'TodoListCreate',
    description: 'Create a new todo list for the current task. Use this when the user asks for a multi-step task.',
    inputSchema: createSchema,
    isReadOnly: true,
    async *execute(input) {
      store.create(input.items);
      return { content: `Created todo list with ${input.items.length} items.` };
    },
  };

  const TodoListUpdate: ToolDef<typeof updateSchema> = {
    name: 'TodoListUpdate',
    description: 'Update the status of a todo item by id.',
    inputSchema: updateSchema,
    isReadOnly: true,
    async *execute(input) {
      store.update(input.id, input.status as TodoStatus);
      return { content: `Updated item ${input.id} to ${input.status}.` };
    },
  };

  return { TodoListCreate, TodoListUpdate };
}
