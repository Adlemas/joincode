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

const multer = require('multer')

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
const Customer = require("./models/Customer");

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

function addProfile(id, doc, type, ip) {
  const createdAt = new Date();
  const expiredAt = new Date(createdAt);
  expiredAt.addHours(12);
  profile_rooms[id] = {
    email: doc.email,
    username: doc.name,
    createdAt: createdAt,
    expiredAt: expiredAt,
    verified: doc.verified,
    signType: type,
    accessIps: [ip],
    themes: doc.themes,
    orders: doc.orders,
    transactions: doc.transactions,
    customers: doc.customers,
    rate: doc.rate,
    videos: doc.videos
  }
}

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
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username || !email || !password)
      return res.send({
        status: false,
        reason: "no-data",
      });

    User.findOne({ name: username })
      .exec()
      .then((doc) => {
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

        addProfile(profileID, doc, 'with-google', ip)

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

          addProfile(profileID, doc, 'by-hand', ip)

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
    urlID: id
  });
});

app.post('/sync', (req, res) => {
  const { theme, name, email } = req.body;

  if(!theme || !name || !email)
    return res.send({
      status: false,
      reason: 'no-data'
    })

  User.findOne({ email: email }).exec()
    .then(doc => {
      if(!doc)
        return res.send({
          status: false,
          reason: 'no-user'
        })

        const customers = doc.customers

        var id = uuid.v4()
        while(rooms[id]) id = uuid.v4()
        rooms[id] = {
          members: [],
          owner: null,
          theme: theme,
          ownerName: name,
          customers: customers || []
        }
        res.status(200).send({
          status: true,
          id: id
        })
    })
})

app.get("/sync/:id", (req, res) => {
  const id = req.params.id;
  if (!rooms[id]) res.sendFile(path.join(__dirname, "/pages/404.html"));
  res.statusCode = 200;
  res.render(path.join(__dirname, "/pages/synchronouse.ejs"), {
    theme: rooms[id].theme,
    name: rooms[id].ownerName,
    customers: rooms[id].customers
  });
});

app.post("/verify", (req, res) => {
  const { email, code, urlID } = req.body;
  if (!email || !code || !urlID)
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

        const identifier = uuid.v4()

        const ip = profile_rooms[urlID].accessIps[0]
        const type = profile_rooms[urlID].signType
                  
        addProfile(identifier, doc, type, ip);
        
        console.log(profile_rooms)
        delete profile_rooms[urlID];
        console.log(profile_rooms)

        res.send({
          status: true,
          newURL: identifier
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

app.post("/customer", (req, res) => {
  const { email, name, password, uri, urlID } = req.body;

  if(!name || !password || !email || !urlID)
    return res.send({
      status: false,
      reason: 'no-data'
    })

  if(!profile_rooms[urlID])
    return res.send({
      status: false,
      reason: 'no-room'
    })

  User.findOne({ email: email }).exec()
    .then(doc => {
      if(!doc)
        return res.send({
          status: false,
          reason: 'no-user'
        })

      Customer.findOne({ name: name }).exec()
        .then(customer => {
          if(customer)
            return res.send({
              status: false,
              reason: 'exists'
            })

          const newCustomer = new Customer({
            name: name,
            password: Buffer.from(password).toString('base64'),
            uri: uri ? uri : null
          })

          newCustomer.save()
            .then(result => {
              if(!result)
                return res.send({
                  status: false,
                  reason: 'serve-error'
                })

              doc.customers.push({
                name: name,
                uri: uri ? uri : null
              })
              doc.save()
                .then(r => {
                  if(!r)
                    return res.send({
                      status: false,
                      reason: 'serve-error'
                    })

                    const identifier = uuid.v4()
                    
                    const ip = req.clientIp
                    const type = profile_rooms[urlID].signType

                    addProfile(identifier, doc, type, ip)
                    
                    console.log(profile_rooms)
                    delete profile_rooms[urlID];
                    console.log(profile_rooms)

                  res.send({
                    status: true,
                    name: name,
                    uri: uri ? uri : null,
                    newURL: identifier
                  })
                })
            })
        })
    })
})

function fileFilter (file) {
  if(['mp4', '.mp4', 'wav', '.wav', 'mpeg', '.mpeg', '.png', 'png', 'jpg', '.jpg', 'jpeg', '.jpeg'].includes(path.extname(file)))
    return true
  else
    return false
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if(file.fieldname === 'preview')
      cb(null, path.join(__dirname, "/public/preview/"))
    else
      cb(null, path.join(__dirname, "/public/uploads/"))
  },
  filename: function (req, file, cb) {
    const status = fileFilter(file.originalname);
    if(!status)
      return cb(null, false)
    const uniqueSuffix = uuid.v4() + '-' + Date.now();
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage: storage })

app.post('/video', upload.fields([{
  name: 'video',
  maxCount: 1
}, {
  name: 'preview',
  maxCount: 1
}]), (req, res) => {
  const files = req.files
  const { title, description, playlist: playlistName, email, urlID } = req.body

  if(!title || !description || !playlistName || !email)
    return res.send({
      status: false,
      reason: 'no-data'
    })

  if(!files)
    return res.send({
      status: false,
      reason: 'no-files'
    })

  const filesInfo = {
    video: {
      
    },
    preview: {

    }
  }

  Object.values(files).forEach(file => {
    if(file[0].fieldname === 'preview')
    {
      filesInfo.preview.name = file[0].originalname
      filesInfo.preview.id = file[0].filename
    }
    else {
      filesInfo.video.name = file[0].originalname
      filesInfo.video.id = file[0].filename
    }
  })

  User.findOne({ email: email }).exec()
    .then(doc => {
      if(!doc)
        return res.send({
          status: false,
          reason: 'no-user'
        })

      var Found = -1
      doc.videos.forEach((playlist, index) => {
        if(playlist.title === playlistName)
          Found = index
      })

      if(Found !== -1)
      {
        doc.videos[Found].sources.push({
          src: '/uploads/' + filesInfo.video.id,
          preview: '/preview/' + filesInfo.preview.id,
          title: title,
          views: 0,
          likes: 0,
          description: description
        })
      }
      else {
        doc.videos.push({
          title: playlistName,
          sources: [
            {
              src: '/uploads/' + filesInfo.video.id,
              preview: '/preview/' + filesInfo.preview.id,
              title: title,
              views: 0,
              likes: 0,
              description: description
            }
          ]
        })
      }

      doc.save()
        .then(r => {
          if(!r)
            return res.send({
              status: false,
              reason: 'serve-error'
            })

          var identifier = uuid.v4()
          while(profile_rooms[identifier]) identifier = uuid.v4()

          addProfile(identifier, doc, profile_rooms[urlID].signType, req.clientIp)

          delete profile_rooms[urlID]

          res.send({
            status: true,
            ...filesInfo,
            newURL: identifier
          })
        })
        .catch(err => {
          return res.send({
            status: false,
            reason: 'serve-error'
          })
        })
    })
})

app.post('/delete-playlist', (req, res) => {
  const { email, playlist: playlistName, urlID } = req.body;

  if(!email || !playlistName || !urlID)
    return res.send({
      status: false,
      reason: 'no-data',
      data: {
        email, playlist: playlistName, urlID
      }
    })

  User.findOne({ email: email }).exec()
    .then(doc => {
      if(!doc || !profile_rooms[urlID])
        return res.send({
          status: false,
          reason: 'no-user'
        })

      var Found = false
      doc.videos.forEach((playlist, index) => {
        if(playlist.title === playlistName)
        {
          doc.videos = doc.videos.filter((val, i) => {
            if(i === index)
            {
              Found = true
              return false;
            }
            else return true;
          })
        }
      })

      var identifier = uuid.v4()
      while(profile_rooms[identifier]) identifier = uuid.v4()

      addProfile(identifier, doc, profile_rooms[urlID].signType, profile_rooms[urlID].accessIps[0])
      delete profile_rooms[urlID]

      if(Found === true)
      {
        doc.save()
          .then(result => {
            if(!result)
              res.send({
                status: false,
                reason: 'serve-error'
              })

              res.send({
                status: true,
                newURL: identifier
              })
          })
      }
      else
        res.send({
          status: false,
          reason: 'not-found'
        })
    })
})

app.get("*", function (req, res) {
  res.status(404).sendFile(path.join(__dirname, "/pages/404.html"));
});

app.post("/customer-login", ({ body: { roomName, name, password, roomID } }, res) => {
  if(!name || !password || !roomID)
    return res.send({
      status: false,
      reason: 'no-data'
    })

  if(!rooms[roomID])
    return res.send({
      status: false,
      reason: 'no-room'
    })
  
  Customer.findOne({ name: name }).exec()
    .then(doc => {
      if(!doc)
        return res.send({
          status: false,
          reason: 'no-user'
        })

      if(doc.password !== Buffer.from(password).toString('base64'))
        return res.send({
          status: false,
          reason: 'incorrect'
        })

      var Found = -1
      rooms[roomID].members.forEach((member, index, arr) => {
        if(member.name === roomName) {
          Found = index
          return;
        }
      })

      if(Found <= -1)
        return res.send({
          status: false,
          reason: 'serve-error'
        })

      rooms[roomID].members[Found].name = name;

      rooms[roomID].members.filter(member => member.id !== Found).forEach(member => {
        if(!member.paused) io.to(member.id).emit('user-logged', {
          id: rooms[roomID].members[Found].id,
          name: name
        })
      })

      const prepared = []

      rooms[roomID].members.forEach(member => {
        prepared.push({
          ...member,
          isOwner: member.id === rooms[roomID].owner
        })
      })
      
      res.send({
        status: true,
        members: prepared
      })
    })
    .catch(err => {
      res.send({
        status: false,
        reason: 'serve-error'
      })
    })
})

io.on("connection", (socket) => {

  socket.on("join-room", ({ id, name }) => {
    var status = false;
    if (rooms[id]) {
      status = true;
      var isOwner = false
      if (rooms[id].members.length <= 0) {
        rooms[id].owner = socket.id;
        isOwner = true
      }
      rooms[id].members.map((val, index, arr) => {
        io.to(val.id).emit("user-join", {
          id: socket.id,
          name: name,
          membersCount: arr.length
        });
      });
      rooms[id].members.push({
        id: socket.id,
        name: isOwner ? rooms[id].ownerName : name,
        text: '',
        pos: {line: 0, ch: 0, sticky: null},
        paused: false
      });
    }
    io.to(socket.id).emit("joined-room", {
      status,
      roomID: id,
      userID: socket.id,
      members: rooms[id].members.filter((val) => {
        return val.id !== socket.id;
      }),
      owner: rooms[id].owner
    });
  });

  socket.on('pause', ({ id, name, user }) => {
    if(!rooms[id]) return;
    rooms[id].members.forEach((member, index) => {
      if(member.id !== user)
        if(!member.paused) io.to(member.id).emit("user-paused", {
          name: name,
          id: user,
        });
      else if(member.id === user) {
        rooms[id].members[index].paused = true
      }
    });
  })

  socket.on('unpause', ({ id, name, user }) => {
    if(!rooms[id]) return;
    rooms[id].members.forEach((member, index) => {
      if(member.id !== user)
        if(!member.paused) io.to(member.id).emit("user-unpaused", {
          name: name,
          id: user,
        });
      else if(member.id === user) {
        rooms[id].members[index].paused = false
      }
    });
  })

  socket.on("text-change", ({ name, text, id, user }) => {
    if(!rooms[id]) return;
    rooms[id].members.forEach((member, index) => {
      if(member.id !== user)
        if(!member.paused) io.to(member.id).emit("text-change", {
          text: text,
          name: name,
          id: user,
        });
      else if(member.id === user) {
        rooms[id].members[index].text = text
      }
    });
  });

  socket.on("cursor-change", ({ name, pos, id, user }) => {
    if(!rooms[id]) return;
    rooms[id].members.forEach((member, index) => {
      if(member.id !== user)
        if(!member.paused) io.to(member.id).emit("cursor-change", {
          pos: pos,
          name: name,
          id: user,
        });
      else if(member.id === user) {
        rooms[id].members[index].pos = pos
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
      rooms[room].members.forEach((user, index, arr) => {
        io.to(user.id).emit("user-leave", {
          id: socket.id,
          name: name,
          isOwner: rooms[room].owner === socket.id,
          membersCount: arr.length
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
