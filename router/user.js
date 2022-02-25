const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const router = express.Router()
const csv = require('csv-parser')
const fs = require('fs')
const User = require('../models/user')
const auth = require('../middleware/auth')

//new user to reigster on app
router.post('/register', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
});

//existing user can login on app
router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.Email, req.body.Password)
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
});

//only logged in user can see profile details by clicking on view profile button
//thats why i used auth in line no 34 for authentication
router.get("/viewProfile", auth, async (req, res) => {
    res.send(req.user)
});

//only logged in user can update profile details by clicking edit profile button
//that why i used auth in line no 40 for authentication
router.patch('/updateProfile', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedupdates = ['Name', 'Email', 'Password', 'MobileNumber', 'DOB', 'City', 'State', 'Country', 'profilepic'];
    const isValidOperation = updates.every((update) => {
        return allowedupdates.includes(update);
    })
    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid Updates" });
    }
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
});

//display list of all users
router.get('/listallusers', async (req, res) => {
    try {
        const user = await User.find();
        res.status(200).send({ user })
    } catch (e) {
        res.status(400).send(e)
    }
});

const uploadImage = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a valid image'))
        }
        cb(undefined, true)
    }
});

router.post('/users/me/profilepic', auth, uploadImage.single('profilepic'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({ width: 250, heigth: 250 }).png().toBuffer();
        req.user.profilepic = buffer;
        await req.user.save();
        res.send()
    } catch (e) {
        res.status(400).send(e)
    }
});

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname);
    },
});

const multerFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(csv|xlsx)$/)) {
        return cb(new Error('Please upload a valid image'))
    }
    cb(undefined, true)
};

const uploadFile = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

router.post('/uploadfile', uploadFile.single('userfile'), async (req, res) => {
    try {
        if (req.body == undefined) {
            throw new Error("Please upload file")
        }
        res.status(200).json({
            status: "success",
            message: "File created successfully!!",
        });
    } catch (e) {
        res.status(400).send(e)
    }
});

router.get('/getalldata', async (req, res) => {
    const results = [];
    fs.createReadStream('../Creditt-App/public/q.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.send(JSON.stringify(results));
        });
});

module.exports = router;