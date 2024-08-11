const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The server is running on http://localhost:3000')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}

initializeDbServer()

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getTodoQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM 
        todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
      break
    case hasPriority(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM 
        todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasStatus(request.query):
      getTodoQuery = `
        SELECT 
        * 
        FROM 
        todo
        WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}';`
      break
    default:
      getTodoQuery = `
        SELECT 
        * 
        FROM 
        todo
        WHERE 
        todo LIKE '%${search_q}%';`
  }

  console.log('Executing query:', getTodoQuery) // Debugging
  try {
    const data = await db.all(getTodoQuery)
    response.send(data)
  } catch (e) {
    console.error('Error executing query:', e.message)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`

  console.log('Executing query:', getTodoQuery) // Debugging
  try {
    const todo = await db.get(getTodoQuery)
    response.send(todo)
  } catch (e) {
    console.error('Error executing query:', e.message)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `INSERT INTO todo (id, todo, priority, status) VALUES ('${id}', '${todo}', '${priority}', '${status}');`

  console.log('Executing query:', postTodoQuery) // Debugging
  try {
    await db.run(postTodoQuery)
    response.send('Todo Successfully Added')
  } catch (e) {
    console.error('Error executing query:', e.message)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`

  try {
    const previousTodo = await db.get(previousTodoQuery)

    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
    } = request.body

    const updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}' WHERE id = ${todoId};`

    console.log('Executing query:', updateTodoQuery) // Debugging
    await db.run(updateTodoQuery)

    if (requestBody.status !== undefined) {
      response.send('Status Updated')
    } else if (requestBody.priority !== undefined) {
      response.send('Priority Updated')
    } else if (requestBody.todo !== undefined) {
      response.send('Todo Updated')
    }
  } catch (e) {
    console.error('Error executing query:', e.message)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`

  console.log('Executing query:', deleteTodoQuery) // Debugging
  try {
    await db.run(deleteTodoQuery)
    response.send('Todo Deleted')
  } catch (e) {
    console.error('Error executing query:', e.message)
    response.status(500).send({error: 'Internal Server Error'})
  }
})

module.exports = app
