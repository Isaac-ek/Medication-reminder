const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const User = require('./models/userModels')
const Medication = require('./models/medication')
const fs = require("fs")
const session = require("express-session")




const app = express()
const PORT = 3000


app.use(session({
    secret: 'i-am-him',
    resave: false,
    saveUninitialized: true
}));
app.use(express.json())
app.use(express.static(path.join(__dirname, 'main')))


// Connect to MongoDB
mongoose.connect('mongodb+srv://Isaac:isaac@group4project.grnwsqg.mongodb.net/?retryWrites=true&w=majority');


//User Login And Authentication
app.get("/", (req, res) => {
    const homePath = `${__dirname}/main/MedRem.html`
    fs.readFile(homePath, "utf8", (err, data) => {
        if (err) {
            console.error(err)
            res.status(500).send("Internal Server Error");
        } else {
            res.send(data);
        }
    })
})

app.get("/user/:name", (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/')
    } else {
        const nextPAth = `${__dirname}/main/MedRem_educational.html`
        fs.readFile(nextPAth, "utf8", (err, data) => {
            if (err) {
                console.error(err)
                res.status(500).send("Internal Server Error");
            } else {
                const updatedData = data.replace('{{username}}', req.session.user.username)
                // Send the updated HTML with user reminders to the client
                res.send(updatedData);
            }
        })
    }
})

app.get("/add-medication", (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/')
    } else {
        const nextPath = `${__dirname}/main/MedRem_Meddeets.html`

        fs.readFile(nextPath, "utf8", (err, data) => {
            if (err) {
                console.error(err)
                res.status(500).send("Internal Server Error");
            } else {
                res.send(data);

            }
        })
    }
})

app.post("/submit", async (req, res) => {
    const {username, password} = req.body
    try {
        const existingUser = await User.findOne({username})
        if (existingUser) {
            if (existingUser.password === password) {
                // add user to session
                req.session.user = existingUser
                res.redirect(`/user/${req.session.user.username}`)
            } else {
                res.status(401).send("Invalid Password")
            }
        } else {
            const newUser = new User({username, password})
            await newUser.save()
            res.redirect(`/user/${req.session.user.username}`)
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Internal Server Error");
    }
})
let user = ''
app.get("/med-list", async (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/')
    } else {
        try {
            user = req.session.user

            const medications = await Medication.find({userId: req.session.user._id}).exec();
            res.json(medications)
        } catch (error) {
            console.error('Error finding medications:', error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    }
})

app.get('/getUserId', (req, res) => {
    const userId = req.session.user._id
    res.json({ userId });
});



app.post("/add-med", async (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/')
    } else {
        const {medicationName, dosage, frequency, nextdosage} = req.body
        const newmed = new Medication({
            userId: req.session.user._id,
            name: medicationName,
            dosage: dosage,
            frequency: frequency,
            nextDose: nextdosage
        })
        await newmed.save();
        res.redirect(`/user/${req.session.user.username}`)
    }
})

app.delete("/med-delete/", async (req, res) => {
    if (req.session.user === undefined) {
        res.redirect('/')
    } else {
        const {id} = req.body
        try {
            const deletedMedication = await Medication.findByIdAndDelete(id).exec();

            if (deletedMedication) {
                res.json({message: 'Medication deleted successfully', deletedMedication});
            } else {
                res.status(404).json({error: 'Medication not found'});
            }
        } catch (error) {
            console.error('Error deleting medication:', error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    }
})


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})