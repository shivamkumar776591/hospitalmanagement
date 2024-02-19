require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const authentication = require("./middleware/auth");
const auth = authentication.auth;
const auth2 = authentication.auth2;
const nodemailer = require('nodemailer');
require("./db/conn");
const Register = require("./models/registers");
const Appointment = require("./models/appointments");
const Registerstaff = require("./models/registerstaffs");
// const Appointment = require('./models/appointments');
const schedule = require('node-schedule');

const port = process.env.PORT || 3000;

const staticpath = path.join(__dirname, "../public");
const templatespath = path.join(__dirname, "../templates/views");
const partialpath = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

app.use("/css", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use("/js", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use("/jq", express.static(path.join(__dirname, "../node_modules/jquery/dist")));

app.use(express.static(staticpath));
app.set("view engine", "hbs");
app.set("views", templatespath);
hbs.registerPartials(partialpath);


app.get("/", (req, res) => {
    res.render("index");
});
app.get("/home", (req, res) => {
    res.render("index");
});
app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/contact", async (req, res) => {
    Registerstaff.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            res.redirect('/contact');
        }
        else {
            res.render("contact", {
                newListItems: foundItems
            })
        }
    })
});
app.get("/register", (req, res) => {
    res.render("register");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/stafflogin", (req, res) => {
    res.render("stafflogin");
});
app.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});
app.get("/staff", async (req, res) => {
    Registerstaff.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            res.redirect('/');
        }
        else {
            res.render("staff", {
                newListItems: foundItems
            })
        }
    })
});
app.get("/patient", async (req, res) => {
    Register.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            res.redirect('/');
        }
        else {
            res.render("patient", {
                newListItems: foundItems
            })
        }
    })
});
app.get("/appoint", async (req, res) => {
    Appointment.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            res.redirect('/');
        }
        else {
            res.render("appoint", {
                newListItems: foundItems
            })
        }
    })
});
app.get("/logoutadmin", (req, res) => {
    res.render("index");
});
app.get("/reshedule/:id", async (req, res) => {
    const aptid = req.params.id;

    try {
        const scheduledata = await Appointment.findById(aptid);

        if (!scheduledata) {
            // Handle the case where the appointment with the given ID is not found
            return res.status(404).send("Appointment not found");
        }

        // console.log(scheduledata);

        // Render the 'reshedule' view with the date and time
        res.render("reshedule", {
            date: scheduledata.date,
            time: scheduledata.time,
            Doctor: scheduledata.doctor,
            id: scheduledata._id
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Internal server error");
    }
});

app.get("/edit", auth, async (req, res) => {
    // console.log(`This is cookie : ${req.cookies.jwt}`);
    res.render("edit");
});
app.get("/appointment/:id", auth, async (req, res) => {
    // console.log(`This is cookie in appointment : ${req.cookies.jwt}`);
    aptid = req.params.id;
    const userdata = await Register.findOne({ _id: aptid });
    // console.log(userdata);
    Registerstaff.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            //    res.render("error");
            console.log("error");
        }
        else {

            res.render("appointment", {
                _id: userdata._id,
                firstname: userdata.firstname,
                lastname: userdata.lastname,
                email: userdata.email,
                newListItems: foundItems,

            })
        }
    })
});
app.get("/logout", auth, async (req, res) => {
    try {
        console.log(req.user);
        req.user.tokens = [];

        res.clearCookie("jwt");
        console.log("logout successfully");
        await req.user.save();
        res.render("login");
    }
    catch (error) {
        res.status(500).send(error);
    }
});
app.get("/logoutstaff", auth2, async (req, res) => {
    try {
        console.log(req.user);
        req.user.tokens = [];

        res.clearCookie("jwt");
        console.log("logout successfully");
        await req.user.save();
        res.render("index");
    }
    catch (error) {
        res.status(500).send(error);
    }
});

app.post("/register", async (req, res) => {
    try {
        console.log(req.body);
        const password = req.body.password;

        const cpassword = req.body.confirmpassword;
        const email = req.body.email;
        firstname = req.body.firstname;
        lastname = req.body.lastname;
        if (password == cpassword) {
            const registerPatient = new Register({
                firstname: firstname.toUpperCase(),
                lastname: lastname.toUpperCase(),
                email: req.body.email,
                gender: req.body.gender,
                phonenumber: req.body.phonenumber,
                age: req.body.age,
                password: password,
                confirmpassword: cpassword
            });
            //  console.log("the success part:" + registerPatient);
            const token = await registerPatient.generateAuthToken();
            console.log("the token part  : " + token);
            // res.send(token);


            const registered = await registerPatient.save();
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'healthcare7312@gmail.com',
                    pass: 'mqogeawpcedmduzd'
                }
            });

            var mailOptions = {
                from: 'healthcare7312@gmail.com',
                to: email,
                subject: 'Registered Successfully',
                text: `Hello  ${firstname} ${lastname}  you have successfully Registered! Book Your Appointment Fast.`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            console.log("the page part : " + registered);
            res.status(201).render("login");

        } else {
            res.send("Password are not Same.");
        }

    } catch (error) {
        res.status(400).send(error);
        console.error(error);
    }
});
app.post("/registerstaff", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        const name = req.body.name.toUpperCase();
        const id = req.body.id;
        const username = req.body.username;
        const email = req.body.email;
        const dob = req.body.dob;
        console.log(dob);
        if (password === cpassword) {
            const registerStaff = new Registerstaff({
                name: name.toUpperCase(),
                id: id,
                username: username,
                email: email,
                gender: req.body.gender,
                phonenumber: req.body.phonenumber,
                dob: dob,
                department: req.body.department,
                password: password,
                confirmpassword: cpassword,
            });
            console.log("the success part:" + registerStaff);
            const token = await registerStaff.generateAuthToken();
            console.log("the token part  : " + token);
            const registeredstaff = await registerStaff.save();
            console.log(registeredstaff);
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'healthcare7312@gmail.com',
                    pass: 'mqogeawpcedmduzd'
                }
            });

            var mailOptions = {
                from: 'rajeshkumarbhatta9@gmail.com',
                to: email,
                subject: 'Appointment Letter',
                text: `Hello  ${name}  welcome to our Healthcare group.I am certain that in your care our patients will be happy and recover fast.  Your Id:${id} and Username is ${username} `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            Registerstaff.countDocuments({}, function (err, docCount) {
                if (err) { return handleError(err) }
                // console.log(docCount);
                Register.countDocuments({}, function (err, pair) {
                    if (err) { return handleError(err) }
                    // console.log(pair);
                    Appointment.countDocuments({}, function (err, num) {
                        if (err) { return handleError(err) }
                        // console.log(num);
                        res.status(201).render("dashboardadmin", {
                            staffnumber: docCount,
                            patientnumber: pair,
                            appointmentnumber: num,
                        });
                    })
                })

            })
        } else {
            res.send("Password are not Same.");
        }

    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const useremail = await Register.findOne({ email: email });
        const isMatch = await bcrypt.compare(password, useremail.password);

        const token = await useremail.generateAuthToken();
        // // console.log("the token part  " + token);

        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 3000000),
            httpOnly: true,
            // secure:true
        });
        // console.log(`This is cookie : ${req.cookies.jwt}`);

        if (isMatch) {
            Appointment.find({ email: useremail.email }, function (err, foundItems) {
                res.status(201).render("dashboardpatient", {
                    newListItems: foundItems,
                    _id: useremail._id,
                    firstname: useremail.firstname,
                    lastname: useremail.lastname,
                    email: useremail.email,
                    gender: useremail.gender,
                    phonenumber: useremail.phonenumber,
                    age: useremail.age,
                });
                // }
            })

        } else {
            res.send("Invalid login Details.");
        }
    } catch (err) {
        res.status(400).send("Invalid login Details.");
    }
});

app.post("/stafflogin", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const user = await Registerstaff.findOne({ username: username });
        const isMatch = await bcrypt.compare(password, user.password);
        const token = await user.generateAuthToken();
        console.log("the token part  " + token);
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 3000000),
            httpOnly: true,
            secure: true
        });
        console.log(`This is cookie : ${req.cookies.jwt}`);
        if (isMatch) {
            // console.log(user);
            doctorname = user.name;
            Appointment.find({ doctor: doctorname }, function (err, foundItems) {
                res.status(201).render("staffprofile", {
                    newListItems: foundItems,
                    _id: user._id,
                    name: user.name,
                    department: user.department,
                    email: user.email,
                    dob: user.dob,
                    id: user.id,
                    username: user.username,
                    gender: user.gender,
                    phonenumber: user.phonenumber,
                    dob: user.dob,
                });
            })
        } else {
            res.send("Invalid login Details.");
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("Invalid login Details.");
    }
});

app.post('/reschedule-appointment/:id', async (req, res) => {
    // console.log(req.params);
    const appointmentId = req.params.id;
    console.log(appointmentId);
    const newDate = req.body.newDate;
    const newTime = req.body.newTime;

    console.log(newDate);
    console.log(newTime);
    console.log(appointmentId);


    try {
        // Find the appointment by ID
        const appointmentData = await Appointment.findOne({ _id: appointmentId });
        console.log(appointmentData);

        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Update the date and time
        appointmentData.date = newDate;
        appointmentData.time = newTime;

        // Save the updated appointment data
        const updatedAppointment = await appointmentData.save();
        console.log(updatedAppointment);
        // res.redirect("");
        // Send a response with the updated appointment data
        res.json({ success: true, message: 'Appointment rescheduled successfully!', appointment: updatedAppointment });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});




app.post("/appointment/:id", async (req, res) => {
    try {
        // console.log(req.body);
        const addid = req.params.id;
        const emailapp = req.body.email;
        const doctor = req.body.doctor;
        const date = req.body.date;
        const time = req.body.time;
        const name = req.body.name;
        const useremaill = await Register.findOne({ email: emailapp });
        const temp = await Appointment.find({ name: doctor });
        console.log(temp);
        if (useremaill.email === emailapp) {

            const appointmentPatient = new Appointment({
                name: req.body.name.toUpperCase(),
                email: req.body.email,
                doctor: req.body.doctor.toUpperCase(),
                date: date,
                time: req.body.time
            })

            const appointed = await appointmentPatient.save();
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'healthcare7312@gmail.com',
                    pass: 'mqogeawpcedmduzd'
                }
            });

            var mailOptions = {
                from: 'healthcare7321@gmail.com',
                to: emailapp,
                subject: 'Appointment Booked',
                text: `Hello  ${name} your  Appointment  is booked at ${date} with the doctor ${doctor} at  time ${time}`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            const appointemail = await Appointment.find({ email: email });
            Appointment.find({ email: useremaill.email }, function (err, foundItems) {
                res.status(201).render("dashboardpatient", {
                    newListItems: foundItems,
                    _id: useremaill._id,
                    firstname: useremaill.firstname,
                    lastname: useremaill.lastname,
                    email: useremaill.email,
                    gender: useremaill.gender,
                    phonenumber: useremaill.phonenumber,
                    age: useremaill.age,
                });
            });
            // }}
            // }
            // else{
            //     res.send("you have a booking at that time slot");
            // }
            // }
            // else{
            //     res.send("choose another time slot");
            // }
        } else {
            res.send("invalid details use same email used while registration");
        }
    } catch (err) {
        res.status(400).send(err);
    }
});


app.post("/adminlogin", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let user = "admin";
    let pass = 'admin';
    if (username === user && password === pass) {
        Registerstaff.countDocuments({}, function (err, docCount) {
            if (err) { return handleError(err) }
            console.log(docCount);
            Register.countDocuments({}, function (err, pair) {
                if (err) { return handleError(err) }
                console.log(pair);
                Appointment.countDocuments({}, function (err, num) {
                    if (err) { return handleError(err) }
                    console.log(num);
                    res.render("dashboardadmin", {
                        staffnumber: docCount,
                        patientnumber: pair,
                        appointmentnumber: num,
                    });
                })
            })

        })


    }
    else {
        res.send("invalid login");
    }
});
//Update the staff Record
app.get("/updatestaff/:id", async (req, res) => {
    const upd_id = req.params.id;
    // console.log(del_id);
    const upddata = await Registerstaff.findOne({ _id: upd_id })
    // console.log(upddata)
    res.render("editstaff", {
        _id: upddata._id,
        name: upddata.name.toUpperCase(),
        email: upddata.email,
        phonenumber: upddata.phonenumber,
        department: upddata.department,
        id: upddata.id,
        username: upddata.username,
        dob: upddata.dob,
        gender: upddata.gender,
    });
});
app.post("/updatestaff/:id", async (req, res) => {
    try {
        const upd_id = req.params.id;
        Registerstaff.findByIdAndUpdate(upd_id, req.body, (err, docs) => {
            if (err) {
                console.log(err);
            }
            else {
                Registerstaff.find({}, function (err, foundItems) {
                    if (foundItems.length === 0) {
                        res.redirect('/');
                    }
                    else {
                        res.render("staff", {
                            newListItems: foundItems
                        })
                    }
                })
            }
        })
    } catch (err) {
        res.status(400).send(err);
    }
});
app.get("/updatepatient/:id", async (req, res) => {
    const upd_id = req.params.id;
    const upddata = await Register.findOne({ _id: upd_id })
    // console.log(upddata)
    res.status(201).render("updatepatient", {
        _id: upddata._id,
        firstname: upddata.firstname.toUpperCase(),
        lastname: upddata.lastname.toUpperCase(),
        email: upddata.email,
        gender: upddata.gender,
        phonenumber: upddata.phonenumber,
        age: upddata.age,
    });
});

app.post("/updatepatient/:id", async (req, res) => {
    try {
        const upd_id = req.params.id;
        Register.findByIdAndUpdate(upd_id, req.body, (err, docs) => {
            if (err) {
                console.log(err);
            }
            else {
                Register.find({}, function (err, foundItems) {
                    if (foundItems.length === 0) {
                        res.redirect('/');
                    }
                    else {
                        res.render("patient", {
                            newListItems: foundItems
                        })
                    }
                })
            }
        })
    } catch (err) {
        res.status(400).send(err);
    }
});
// Deletion of staff,patient and appointment

app.get("/deletestaff/:id", (req, res) => {

    const del_id = req.params.id;
    // console.log(del_id);
    const deldata = Registerstaff.findByIdAndDelete(del_id, (err) => {
        if (!err) {
            console.log("deleted");
            res.redirect("/staff");
        }
    })
});

app.get("/deletepatient/:id", (req, res) => {

    const del_id = req.params.id;
    // console.log(del_id);

    const email = del_id.email;

    const deldata = Register.findByIdAndDelete(del_id, (err) => {
        if (!err) {
            console.log("deleted patient");
            res.redirect("/patient");
        }
    })
});

app.get("/deleteappointment/:id", async (req, res) => {

    const del_id = req.params.id;

    const find = await Appointment.findById(del_id);

    const { name, email } = find;
    console.log(find);


    // console.log(del_id);
    const deldata = Appointment.findByIdAndDelete(del_id, (err) => {
        if (!err) {

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'healthcare7312@gmail.com',
                    pass: 'mqogeawpcedmduzd'
                }
            });

            var mailOptions = {
                from: 'healthcare7312@gmail.com',
                to: email,
                subject: 'Appointment Cancellation',
                text: `Hello  ${name}   Your appointment has been cancelled please book again if you want to continue.`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            console.log("deleted appointment");
            res.redirect("/appoint");
        }
    })
});
app.get("/delayappointment/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Fetch the necessary data from your database based on the ID
        const appointment = await Appointment.findById(id);
        const email = appointment.email;
        const name = appointment.name;

        if (appointment) {


            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'healthcare7312@gmail.com',
                    pass: 'mqogeawpcedmduzd'
                }
            });

            const mailOptions = {
                from: 'healthcare7312@gmail.com',
                to: email,
                subject: 'Appointment delayed',
                text: `Hello  ${name}  Your appointment has been delayed sorry for inconvience.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    // Handle the error, e.g., res.status(500).send("Email not sent");
                } else {
                    console.log('Email sent: ' + info.response);
                    // Handle the success, e.g., res.send("Email sent successfully");
                }
            });
            console.log("deleted appointment");
            res.redirect("/appoint");
        } else {
            res.status(404).send("Appointment not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error occurred");
    }
});


function convertTimeToMinutes(timeString) {
    const [timeStart, timeEnd] = timeString.split('-').map(part => part.trim());

    // Function to convert time string to minutes
    const convertPartToMinutes = (timePart) => {
        const [hours, minutes] = timePart.split(/[.:]/);
        return parseInt(hours) * 60 + parseInt(minutes);
    };

    const startMinutes = convertPartToMinutes(timeStart);
    const endMinutes = convertPartToMinutes(timeEnd);

    return { start: startMinutes, end: endMinutes };
}

// Function to check appointments and send alerts
function checkAppointments() {
    const currentDate = new Date();

    Appointment.find({})
        .then(appointments => {
            appointments.forEach(appointment => {
                // Convert appointment time to minutes for comparison
                const { start, end } = convertTimeToMinutes(appointment.time);

                // Declare currentMinutes within this scope
                const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

                // Check if the appointment start time is within the next 30 minutes
                if (currentDate.toISOString().split('T')[0] === appointment.date && start - currentMinutes <= 30) {
                    // Send your alert email logic here
                    sendAppointmentAlert(appointment);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching appointments:', error);
        });
}

// Function to send appointment alerts
function sendAppointmentAlert(appointment) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'healthcare7312@gmail.com', // Replace with your Gmail address
            pass: 'mqogeawpcedmduzd', // Replace with your Gmail password or an application-specific password
        },
    });

    const mailOptions = {
        from: 'healthcare7312@gmail.com',
        to: appointment.email,
        subject: 'Appointment Alert',
        text: ` Hello ${appointment.name} Your appointment for ${appointment.doctor} is scheduled in 30 minutes. Please check your email for details.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
    console.log(`Sending email alert for appointment: ${appointment.date} ${appointment.time}`);
}

// Schedule a job to run the checkAppointments function every minute
const job = schedule.scheduleJob('*/30 * * * *', function () {
    checkAppointments();
});



app.listen(port, () => {
    console.log(`Server is running at port no ${port}`);
});