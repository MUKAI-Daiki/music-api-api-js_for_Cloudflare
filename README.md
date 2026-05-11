# music-api-js

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

A Deno-based web server that provides a simple API wrapper for [MUSICAPI.ORG](https://sunoapi.org/) to generate music, lyrics, and instrumental tracks.

This server acts as a middleware to simplify the asynchronous, callback-based workflow of the underlying music generation service, making it easy to integrate into front-end applications.

## Features

-   **Full Song Generation**: Create complete songs (lyrics and music) from a single text prompt.
-   **Custom Lyrics to Music**: Generate music for your own lyrics.
-   **Instrumental Tracks**: Create background music based on a style and title.
-   **Lyric Generation**: Automatically generate lyrics from a theme.
-   **Asynchronous Flow Handling**: Manages the API's task-based system with a simple polling mechanism.
-   **Demo Applications**: Includes three ready-to-run front-end demos.

## Live Demos

Once the server is running, you can access the following demo pages in your browser at `http://localhost:7001`:

-   **Simple Generation** (`index.html`): Generate a full song from a descriptive prompt like "80s J-pop, heartbreak song".
-   **Lyrics to Music** (`lyric.html`): First, generate lyrics from a theme, then select the generated text to create a song.
-   **Instrumental** (`inst.html`): Create an instrumental track from a title and style description (e.g., "epic fantasy adventure, orchestral").

## How It Works

This server simplifies the interaction with the asynchronous MUSICAPI.ORG service.

1.  **Request**: The client (browser) sends a generation request to this server (e.g., `/api/fetchGenerateMusicCustom`).
2.  **Task Creation**: The server forwards the request to MUSICAPI.ORG, which immediately returns a `taskId`. This ID is sent back to the client.
3.  **Polling**: The client begins periodically calling the server's `/api/fetchTask` endpoint with the `taskId` to check for results.
4.  **Callback**: When music generation is complete, MUSICAPI.ORG sends the results via a POST request to the `CALLBACKBASE` URL you configure (which points to this server's `/api/callBack` endpoint).
5.  **Caching**: The server receives the callback and saves the result data as a JSON file in the `./cache/` directory, named after the `taskId`.
6.  **Completion**: The client's next polling request finds the cached JSON file, receives the final music data (including audio URLs), and completes the process.

## Getting Started

### Prerequisites

-   [Deno](https://deno.com/) runtime installed.
-   An API key from [MUSICAPI.ORG](https://sunoapi.org/).
-   A publicly accessible URL for your server. This is required for the MUSICAPI.ORG callback. For local development, you can use a tunneling service like [ngrok](https://ngrok.com/) to expose your local server to the internet.

### Setup and Launch

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/code4fukui/music-api-js.git
    cd music-api-js
    ```

2.  **Configure your environment:**
    Copy the example environment file and edit it.
    ```sh
    cp .env.example .env
    ```
    Open the `.env` file and add your API key and public callback URL:
    ```env
    APIKEY=your_api_key_from_musicapi_org
    CALLBACKBASE=https://your-publicly-accessible-url.com
    ```
    *Note: `CALLBACKBASE` must be the public URL where MUSICAPI.ORG can reach your running server.*

3.  **Run the server:**
    ```sh
    deno serve -A --port=7001 --host="[::]" server.js
    ```
    The `-A` flag grants all necessary permissions (file system access for caching, network access).

4.  **Try the demos:**
    Open your web browser and navigate to `http://localhost:7001`.

## API Endpoints

This server provides the following API endpoints. All endpoints return a `taskId` which can be used with `/api/fetchTask` to get the final result.

-   `GET /api/fetchLyrics`
    -   Generates lyrics from a theme.
    -   **Query Parameters:**
        -   `prompt` (string): The theme or idea for the lyrics.

-   `GET /api/fetchGenerateMusicSimple`
    -   Generates a complete song (lyrics and music) automatically from a single prompt.
    -   **Query Parameters:**
        -   `prompt` (string): A description of the desired song (e.g., "A cheerful pop song about a sunny day").
        -   `negativeTags` (string, optional): Tags to exclude from the generation.

-   `GET /api/fetchGenerateMusicCustom`
    -   Generates a song using provided lyrics, title, and style.
    -   **Query Parameters:**
        -   `prompt` (string): The lyrics for the song.
        -   `style` (string): The musical style (e.g., "heavy metal, female vocals").
        -   `title` (string): The title of the song.
        -   `negativeTags` (string, optional): Tags to exclude.

-   `GET /api/fetchGenerateMusicCustomInstrumental`
    -   Generates an instrumental track.
    -   **Query Parameters:**
        -   `style` (string): The musical style of the instrumental.
        -   `title` (string): The title of the track.
        -   `negativeTags` (string, optional): Tags to exclude.

-   `GET /api/fetchTask`
    -   Retrieves the status or final result of a generation task. The client polls this endpoint.
    -   **Query Parameters:**
        -   `taskId` (string): The ID of the task to check.

-   `POST /api/callBack`
    -   An internal endpoint for receiving results from MUSICAPI.ORG. This should not be called directly.

## License

This project is licensed under the MIT License.