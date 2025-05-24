import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = ''; // using proxy

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`/todos`);
      setTodos(res.data);
    } catch (error) {
      console.error("Failed to fetch todos:", error.message);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axios.post(`/todos`, { text: newTodo });
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error.message);
    }
  };

  const editTodo = (id, text) => {
    setEditingId(id);
    setEditingText(text);
  };

  const updateTodo = async (id) => {
    if (!editingText.trim()) return;
    try {
      await axios.put(`/todos/${id}`, { text: editingText });
      setEditingId(null);
      setEditingText('');
      fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error.message);
    }
  };

  const summarizeTodos = async () => {
    try {
      const res = await axios.post(`/summarize`);
      setMessage(res.data.message || 'Summary sent.');
    } catch (error) {
      console.error("Summarize failed:", error.message);
      setMessage('Failed to summarize or send to Slack.');
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Todo Summary Assistant</h1>
      <input
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="New todo"
      />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {editingId === todo.id ? (
              <>
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <button onClick={() => updateTodo(todo.id)}>Save</button>
              </>
            ) : (
              <>
                {todo.text}
                <button style={{ marginLeft: 10 }} onClick={() => deleteTodo(todo.id)}>Delete</button>
                <button style={{ marginLeft: 5 }} onClick={() => editTodo(todo.id, todo.text)}>✏️ Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <button onClick={summarizeTodos}>Summarize & Send to Slack</button>
      {message && <p>{message}</p>}
    </div>
  );
}
