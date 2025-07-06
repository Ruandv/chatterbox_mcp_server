# 🚀 Chatterbox MCP Server (indexed and certified by [MCPHub](https://mcphub.com/mcp-servers/Ruandv/chatterbox_mcp_server)

Welcome to **Chatterbox MCP Server**, a cutting-edge implementation of the **Model Context Protocol (MCP)** designed for personal use. This server acts as a bridge between your applications and powerful AI models, enabling seamless communication and integration with tools like WhatsApp. Whether you're building a chatbot, automating tasks, or experimenting with AI, this server is your go-to solution!

---

## 🌟 Features

- **Dynamic Resource Management**: Easily register and manage resources using the MCP framework.
- **WhatsApp Integration**: Retrieve and send WhatsApp messages, lookup contact details effortlessly with built-in tools.
- **Environment-Driven Configuration**: Securely manage secrets and environment variables for flexible deployments.
- **Stdio Transport**: Communicate with the server using standard input/output for simplicity and portability.
- **Docker-Ready**: Deploy the server in a containerized environment with ease.

---

## 🛠️ Technologies Used

This project leverages the following technologies to deliver a robust and scalable solution:

- **TypeScript**: Ensures type safety and modern JavaScript features.
- **Node.js**: Provides a fast and efficient runtime for the server.
- **Model Context Protocol SDK**: Powers the server's core functionality.
- **Zod**: Validates input schemas for tools and resources.
- **Express**: Simplifies HTTP server creation and routing.
- **Docker**: Enables containerized deployment for consistent environments.
- **Nodemon**: Facilitates live development with automatic restarts.

---

## 📂 Project Structure

Here's a quick overview of the project's structure:

src/
    src/server.ts          # Main server entry point
    model/
        src/model/resources.ts   # Resource registration logic
        src/model/tools.ts       # Tool registration logic (e.g., WhatsApp tools)
    types/
        src/types/types.ts       # Type definitions for the project
secrets/               # Secure environment variable files
.vscode/               # VS Code configuration files
package.json           # Project metadata and scripts
tsconfig.json          # TypeScript configuration
dockerfile             # Docker configuration for containerization
README.md              # You're reading it now!

---

## 🚀 Getting Started

1. **Clone the Repository**:
   git clone https://github.com/your-repo/chatterbox_mcp_server.git
   
   cd chatterbox_mcp_server

2. **Install Dependencies**:
   npm install

3. **Run in Development Mode**:
   npm run dev

4. **Build and Start**:
   npm run build
   npm start

5. **Run with Docker**:
   npm run docker:local

---

## 🌐 WhatsApp Tools

### Retrieve Messages
Fetch missed messages for a specific phone number:
```json
{
  "phoneNumber": "+1234567890",
  "numberOfRecords": "5"
}
```

### Send Messages
Send a message to a specific phone number:
```json
{
  "phoneNumber": "+1234567890",
  "message": "Hello from Chatterbox MCP Server!"
}
```

### Retrieve User
Look up a WhatsApp user by name and get their WhatsApp ID:
```json
{
  "contactName": "John Doe"
}
```

---

## 🤖 Why Chatterbox MCP Server?

This project is more than just a server—it's a playground for innovation. Whether you're a developer exploring AI integrations or a hobbyist automating your workflows, **Chatterbox MCP Server** empowers you to bring your ideas to life.

---

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and share it as you see fit.

---

## 💬 Feedback & Contributions

We'd love to hear your thoughts! Feel free to open an issue or submit a pull request to contribute to the project.

Happy coding! 🎉
