import type { TodoItem, TodoStatus } from './types.js';

export class TodoStore {
  private items: TodoItem[] = [];

  getItems(): TodoItem[] {
    return this.items;
  }

  create(items: string[]) {
    this.items = items.map((title, idx) => ({
      id: String(idx + 1),
      title,
      status: 'pending',
    }));
  }

  update(id: string, status: TodoStatus) {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = status;
    }
  }

  clear() {
    this.items = [];
  }
}
