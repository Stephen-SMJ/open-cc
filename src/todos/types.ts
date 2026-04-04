export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'failed';

export type TodoItem = {
  id: string;
  title: string;
  status: TodoStatus;
};

export type TodoListState = {
  items: TodoItem[];
};
