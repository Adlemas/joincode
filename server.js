const uuid = require("uuid");

const vm = require("vm");

const path = require("path");

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const bodyParser = require("body-parser");

const FormData = require("form-data");
const fetch = require("node-fetch");
if (!globalThis.fetch) globalThis.fetch = fetch;

const requestIp = require("request-ip");

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client({
  clientId:
    "938772614927-n65aas37mnlj47u152661c7dap5vh541.apps.googleusercontent.com",
  clientSecret: "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",
});

const mongoose = require("mongoose");
const User = require("./models/User");

const PORT = 4000;
const CLIENT_ID =
  "938772614927-n65aas37mnlj47u152661c7dap5vh541.apps.googleusercontent.com";

const rooms = {};

const profile_rooms = {};

const verify_users = {};

app.use(express.static(path.join(__dirname, "/public/")));
app.use(bodyParser.json());
app.use("/jquery", express.static(__dirname + "/node_modules/jquery/dist/"));
app.use(requestIp.mw());

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.statusCode = 200;
  res.sendFile(path.join(__dirname, "/pages/index.html"), (err) => {
    if (err) console.log(err);
  });
});

app.get("/privacy-policy", (req, res) => {
  res
    .status(200)
    .sendFile(path.join(__dirname, "/pages/privacy-policy.html"), (err) => {
      if (err) console.log(err);
    });
});

app.get("/terms", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/pages/terms.html"), (err) => {
    if (err) console.log(err);
  });
});

app.get("/signup", (req, res) => {
  res
    .status(200)
    .sendFile(path.join(__dirname, "/pages/signup.html"), (err) => {
      if (err) console.log(err);
    });
});

app.post("/signup", async (req, res) => {
  if (req.body?.type === "by-hand") {
    // FIXME: add sign up by hands optimizer
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username || !email || !password)
      return res.send({
        status: false,
        reason: "no-data",
      });

    console.log(username, email, password);

    User.findOne({ name: username })
      .exec()
      .then((doc) => {
        console.log(doc);
        if (doc != null)
          return res.send({
            status: false,
            reason: "username-exists",
          });

        User.findOne({ email: email })
          .exec()
          .then((doc) => {
            if (doc != null)
              return res.send({
                status: false,
                reason: "email-exists",
              });

            const user = new User({
              name: username,
              email: email,
              verified: false,
              password: Buffer.from(password).toString("base64"),
            });
            user
              .save()
              .then((result) => {
                if (!result)
                  return res.send({
                    status: false,
                    reason: "serve-error",
                  });

                res.send({
                  status: true,
                });
              })
              .catch((err) => {
                res.send({
                  status: false,
                  reason: "serve-error",
                });
              });
          });
      });
  } else {
    res.send({
      status: false,
      reason: "undefined-signup-type",
    });
  }
});

app.post("/signin", async (req, res) => {
  if (req.body?.type === "with-google") {
    const credential = req.body?.credential;
    if (!credential)
      return res.send({
        status: false,
        reason: "no-credential",
      });
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    User.findOne({ email: payload.email })
      .exec()
      .then((doc) => {
        if (!doc)
          return res.send({
            status: false,
            reason: "no-user",
          });

        var ip = req.clientIp;

        var profileID = uuid.v4();
        while (profile_rooms[profileID]) profileID = uuid.v4();

        const createdAt = new Date();
        const expiredAt = new Date(createdAt);
        expiredAt.addHours(12);

        profile_rooms[profileID] = {
          email: doc.email,
          username: doc.name,
          createdAt: createdAt,
          expiredAt: expiredAt,
          verified: doc.verified,
          signType: "with-google",
          accessIps: [ip],
          themes: doc.themes
        };

        res.send({
          status: true,
          profile_id: profileID,
        });
      });
  } else if (req.body?.type === "by-hand") {
    if (!req.body?.email || !req.body?.password)
      return res.send({
        status: false,
        reason: "no-data",
      });

    User.findOne({ email: req.body?.email })
      .exec()
      .then((doc) => {
        if (!doc)
          return res.send({
            status: false,
            reason: "no-user",
          });

        if (
          doc.password === Buffer.from(req.body.password).toString("base64")
        ) {
          var ip = req.clientIp;

          var profileID = uuid.v4();
          while (profile_rooms[profileID]) profileID = uuid.v4();

          const createdAt = new Date();
          const expiredAt = new Date(createdAt);
          expiredAt.addHours(12);

          profile_rooms[profileID] = {
            email: doc.email,
            username: doc.name,
            verified: doc.verified,
            createdAt: createdAt,
            expiredAt: expiredAt,
            signType: "by-hand",
            accessIps: [ip],
            themes: doc.themes
          };

          res.send({
            status: true,
            profile_id: profileID,
          });
        } else {
          return res.send({
            status: false,
            reason: "password-incorrect",
          });
        }
      });
  } else {
    res.send({
      status: false,
      reason: "undefined-signin-type",
    });
  }
});

app.get("/profile/:id", (req, res) => {
  const id = req.params.id;
  var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (
    !profile_rooms[id] ||
    profile_rooms[id].createdAt.getTime() >=
      profile_rooms[id].expiredAt.getTime() ||
    !profile_rooms[id].accessIps.includes(ip)
  )
    return res.status(404).sendFile(path.join(__dirname, "/pages/404.html"));
  res.status(200).render(path.join(__dirname, "/pages/profile.ejs"), {
    ...profile_rooms[id],
  });
});

app.post('/sync', (req, res) => {
  const { theme, name} = req.body;
   var id = uuid.v4()
   while(rooms[id]) id = uuid.v4()
   rooms[id] = {
     members: [],
     owner: null,
     theme: theme,
     ownerName: name
   }
   res.status(200).send({
     status: true,
     id: id
   })
})

app.get("/sync/:id", (req, res) => {
  const id = req.params.id;
  if (!rooms[id]) res.sendFile(path.join(__dirname, "/pages/404.html"));
  res.statusCode = 200;
  res.render(path.join(__dirname, "/pages/synchronouse.ejs"), {
    theme: rooms[id].theme,
    name: rooms[id].ownerName
  });
});

app.post("/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.send({
      status: false,
      reason: "no-data",
    });

  if (!verify_users[email])
    return res.send({
      status: false,
      reason: "expired",
    });
  else if (String(verify_users[email].code) !== code)
    return res.send({
      status: false,
      reason: "incorrect",
    });

  User.findOne({ email: email })
    .exec()
    .then((doc) => {
      if (!doc)
        return res.send({
          status: false,
          reason: "no-such-user",
        });

      doc.verified = true;

      doc.save().then((result) => {
        if (!result)
          return res.send({
            status: false,
            reason: "serve-error",
          });
        res.send({
          status: true,
        });
      });
    });
});

app.post("/verifing", (req, res) => {
  const { email, username, strong } = req.body;
  if (!email || !username)
    return res.send({
      status: false,
      reason: "no-data",
    });

  User.findOne({ email: email })
    .exec()
    .then((doc) => {
      if (!doc)
        return res.send({
          status: false,
          reason: "no-user",
        });

      var code = Math.min(999999, Math.floor(Math.random() * 999999) + 111111);

      if (!verify_users[email])
        verify_users[email] = {
          status: "pending",
          code: code,
        };
      else if(!strong) code = verify_users[email].code;
      else verify_users[email].code = code

      if (verify_users[email].status === "pending") {
        verify_users[email].status === "in process";
        const formData = new FormData();
        formData.append("email", email);
        formData.append("name", username);
        formData.append("code", code);

        fetch("http://adlemas.com/mail.php", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((json) => {
            console.log(json);
            if (json.status === true) {
              verify_users[email].status = "delivered";
              res.send({
                status: true,
              });
            } else {
              verify_users[email].status = "return";
              res.send({
                status: false,
                reason: "serve-error",
              });
            }
          });
      } else {
        res.send({
          status: true,
        });
      }
    });
});

app.get("*", function (req, res) {
  res.status(404).sendFile(path.join(__dirname, "/pages/404.html"));
});

io.on("connection", (socket) => {

  socket.on("execute-code", ({ code, roomID, name }) => {
    if (!rooms[roomID]) {
      io.to(socket.id).emit("executed-code", {
        status: false,
        reason: "no-such-room",
      });
      return;
    }
    var result = "";

    const sandbox = {
      console: {
        log: function (...args) {
          result += args.join(" ");
          result += "\n";
        },
      },
    };
    vm.createContext(sandbox);

    vm.runInContext(code, sandbox);

    rooms[roomID].members.forEach((member) => {
      io.to(member.id).emit("executed-code", {
        status: true,
        sandbox: sandbox,
        name: name,
        result: result,
      });
    });
  });

  socket.on("join-room", ({ id, name }) => {
    var status = false;
    if (rooms[id]) {
      status = true;
      if (rooms[id].members.length <= 0) rooms[id].owner = socket.id;
      rooms[id].members.map((val) => {
        io.to(val.id).emit("user-join", {
          id: socket.id,
          name: name,
        });
      });
      rooms[id].members.push({
        id: socket.id,
        name: name,
        isOwner: rooms[id].owner === socket.id,
        text: ''
      });
    }
    io.to(socket.id).emit("joined-room", {
      status,
      roomID: id,
      userID: socket.id,
      members: rooms[id].members.filter((val) => {
        return val.id !== socket.id;
      }),
    });
  });

  socket.on("text-change", ({ name, text, id, user }) => {
    rooms[id].members.forEach((member, index) => {
      io.to(member.id).emit("text-change", {
        text: text,
        name: name,
        id: user,
      });
      if(member.id === user) {
        rooms[id].members[index].text = text
      }
    });
  });

  socket.on("disconnect", () => {
    const roomIDs = [];
    Object.keys(rooms).forEach((key) => {
      rooms[key].members = rooms[key].members.filter((val) => {
        if (val.id === socket.id) {
          roomIDs.push({
            room: key,
            name: val.name,
          });
          return false;
        }
        return true;
      });
    });
    roomIDs.forEach(({ room, name }) => {
      rooms[room].members.forEach((user) => {
        io.to(user.id).emit("user-leave", {
          id: socket.id,
          name: name,
          isOwner: rooms[room].owner === socket.id
        });
      });
    });
  });
});

const dbURL =
  "mongodb+srv://main:Dondurma1953@joincode.ca8e2.mongodb.net/users?retryWrites=true&w=majority";
mongoose
  .connect(dbURL)
  .then((result) =>
    server.listen(PORT, () => {
      console.log("Listening on http://localhost:" + PORT);
    })
  )
  .catch((err) => console.log(err));
