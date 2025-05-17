import { gql } from 'aws-amplify'

export const createTask = gql`
  mutation CreateTask(
    $title: String!
    $description: String
    $assigneeId: String!
    $status: String!
    $priority: String!
    $dueDate: AWSDate!
  ) {
    createTask(input: {
      title: $title
      description: $description
      assigneeId: $assigneeId
      status: $status
      priority: $priority
      dueDate: $dueDate
    }) {
      id
      title
      description
      assigneeId
      status
      priority
      dueDate
      createdAt
      updatedAt
    }
  }
`

export const updateTask = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $assigneeId: String
    $status: String
    $priority: String
    $dueDate: AWSDate
  ) {
    updateTask(input: {
      id: $id
      title: $title
      description: $description
      assigneeId: $assigneeId
      status: $status
      priority: $priority
      dueDate: $dueDate
    }) {
      id
      title
      description
      assigneeId
      status
      priority
      dueDate
      createdAt
      updatedAt
    }
  }
`

export const deleteTask = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(input: { id: $id }) {
      id
    }
  }
`