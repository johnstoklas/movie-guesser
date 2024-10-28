# Movie Match-Up

A multiplayer web-based game where two players face off to see who can get 10 movies in chronological release order based on movie frames. This game takes inspiration from the real-life card game Hitster. I wasn't doing very well in the game and I knew if the game involved movies I would be doing much better. Thus, Movie Match-Up was created.

---

### Folder Descriptions

- **client**: Main code for the front end of the application
  - **index.html**: Contains the HTML formatting for the website
  - **index.js**: Contains logic used for checking where your movie belongs in your timeline and has calls to TMDB API to fetch data for the game
- **public**: Holds styling info
  - **style.css**: Has styling elements used in the website

- **app.js**: Holds all the back end code, this code is used to send data from the client side to the server and then to their opponent. For example, if a player correctly places a movie in order it sends that data to their opponent and tells them how long their opponent's timeline is.
