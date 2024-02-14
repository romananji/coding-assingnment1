const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const {format} = require('date-fns')
const bcrypt = require('bcrypt')
var isValid = require('date-fns/isValid')
var parseISO = require('date-fns/parseISO')
let db = null
const initializedbAndServer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, function () {
      console.log('Server is loading')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializedbAndServer()
const a = function (obj) {
  return obj.status !== undefined
}
const b = function (obj) {
  return obj.priority !== undefined
}
const c = function (obj) {
  return obj.priority !== undefined && obj.status !== undefined
}
const d = function (obj) {
  return obj.search_q !== ''
}
const e = function (obj) {
  return obj.category !== undefined && obj.status !== undefined
}
const f = function (obj) {
  return obj.category !== undefined
}
const g = function (obj) {
  return obj.category !== undefined && obj.priority !== undefined
}
app.get('/todos/', async function (request, response) {
  const {search_q = '', todo, category, priority, status} = request.query
  let getQuery = ''
  switch (true) {
    case a(request.query):
      if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        getQuery = `
            SELECT * 
            FROM 
                todo 
            WHERE 
                status='${status}';
            `
      }
      break
    case b(request.query):
      if (
        priority !== 'HIGH' &&
        (priority !== 'MEDIUM') & (priority !== 'LOW')
      ) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        getQuery = `
        SELECT * 
        FROM 
          todo 
        WHERE 
          priority='${priority}' 
          AND todo LIKE '%${search_q}%';
        `
      }
      break
    case c(request.query):
      if (status !== 'TO DO' && status !== 'IN PROGRESS' && status !== 'DONE') {
        response.status(400)
        response.send('Invalid status')
      } else {
        getQuery = `
        SELECT * 
        FROM 
          todo 
        WHERE 
          todo LIKE '%${search_q}%'
          AND status='${status}'
          AND priority='${priority}';
        `
      }
      break
    case d(request.query):
      getQuery = `
      SELECT * 
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%';
      `
      break
    case e(request.query):
      if (
        category !== 'WORK' &&
        category !== 'HOME' &&
        category !== 'LEARNING'
      ) {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        getQuery = `
        SELECT * 
        FROM 
          todo 
        WHERE 
          todo LIKE '%${search_q}%'
          AND category='${category}'
          AND status='${status}';
        `
      }
      break
    case f(request.query):
      if (
        category !== 'WORK' &&
        category !== 'HOME' &&
        category !== 'LEARNING'
      ) {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        getQuery = `
        SELECT * 
        FROM 
          todo 
        WHERE 
          category='${category}';
        `
      }
      break
    case g(request.query):
      if (
        category !== 'HOME' &&
        category !== 'WORK' &&
        category !== 'LEARNING'
      ) {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        getQuery = `
        SELECT * 
        FROM 
          todo 
        WHERE 
          category='${category}'
          AND priority='${priority}';
        `
      }
      break
  }
  const result = await db.all(getQuery)
  response.send(result)
})

app.get('/todos/:todoId/', async function (request, response) {
  const {todoId} = request.params
  const getTodoByIdQuery = `
  SELECT * 
  FROM 
    todo 
  WHERE 
    id=${todoId};
  `
  const result = await db.get(getTodoByIdQuery)
  response.send({
    id: result.id,
    todo: result.todo,
    priority: result.priority,
    status: result.status,
    category: result.category,
    dueDate: result.due_date,
  })
})

app.get('/agenda/', async function (request, response) {
  let getDateQuery
  const {date} = request.query
  const b = parseISO(date)
  console.log(b)
  if (b === 'Invalid Date') {
    response.status(400)
    response.send('Invalid Date')
  } else {
    const a = format(new Date(date), 'yyyy-MM-dd')
    getDateQuery = `
    SELECT * 
    FROM 
      todo 
    WHERE 
      due_date='${a}';
    `
  }

  const result = await db.get(getDateQuery)
  response.send(result)
})

app.post('/todos/', async function (request, response) {
  const {id, todo, priority, status, category, dueDate} = request.body
  const postTodoQuery = `
  INSERT INTO todo 
    (id,todo,priority,status,category,due_date)
  VALUES 
    (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');
  `
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async function (request, response) {
  const {todoId} = request.params
  const requestBody = request.body
  let coulumnValue = ''
  switch (true) {
    case requestBody.status !== undefined:
      coulumnValue = 'Status'
      break
    case requestBody.priority !== undefined:
      coulumnValue = 'Priority'
      break
    case requestBody.todo !== undefined:
      coulumnValue = 'Todo'
      break
    case requestBody.category !== undefined:
      coulumnValue = 'Category'
      break
    case requestBody.dueDate !== undefined:
      coulumnValue = 'Due Date'
      break
  }
  const getPreviousTodoQuery = `
  SELECT * 
  FROM 
    todo 
  WHERE 
    id=${todoId};
  `
  const previousTodo = await db.get(getPreviousTodoQuery)
  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body
  const updateQuery = `
  UPDATE todo 
  SET status='${status}',
      priority='${priority}',
      todo='${todo}',
      category='${category}',
      due_date='${dueDate}'
  WHERE 
    id=${todoId};
  `
  await db.run(updateQuery)
  response.send(`${coulumnValue} Updated`)
})

app.delete('/todos/:todoId', async function (request, response) {
  const {todoId} = request.params
  const deleteTodQuery = `
  DELETE FROM todo 
  WHERE 
    id=${todoId};
  `
  await db.run(deleteTodQuery)
  response.send('Todo Deleted')
})

module.exports = app
