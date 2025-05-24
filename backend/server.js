
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); // ✅ Modern SDK import
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let todos = []; // In-memory DB

// GET /todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// POST /todos
app.post('/todos', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const newTodo = { id: uuidv4(), text, completed: false };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// DELETE /todos/:id
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  todos = todos.filter(todo => todo.id !== id);
  res.status(204).send();
});

// POST /summarize
app.post('/summarize', async (req, res) => {
  try {
    console.log("✅ /summarize called");
    console.log("🔑 OpenAI key loaded:", !!process.env.OPENAI_API_KEY);
    console.log("🔗 Slack URL loaded:", !!process.env.SLACK_WEBHOOK_URL);

    const pendingTodos = todos.filter(todo => !todo.completed).map(t => t.text).join("\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Summarize the following todos:\n" + pendingTodos }
      ]
    });

    const summary = gptResponse.choices[0].message.content;
    console.log("🧠 OpenAI summary generated:", summary);

    const slackResponse = await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: summary,
    });

    console.log("📤 Slack response:", slackResponse.status, slackResponse.statusText);

    res.json({ message: 'Summary sent to Slack successfully.' });
  } catch (err) {
    console.error("🔥 Error in /summarize:", err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to summarize or send to Slack.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// PUT /todos/:id
app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  const index = todos.findIndex(todo => todo.id === id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  todos[index].text = text;
  res.json(todos[index]);
});
