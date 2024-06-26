const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const CORS = require("../middleware/cors.js");
const authenticateToken = require("../middleware/authenticateToken.js");

const networkRouter = express.Router();

// networkRouter.use(CORS)


// FETCH PROFILES BASED ON SEARCH QUERY
networkRouter.get('/searchQuery', authenticateToken,expressAsyncHandler(async (request, response) => {
    const searchName = request.query.name.trim(); // Trim whitespace
    const currentUserEmail = request.query.currentUser; 

    try {
        const currentUser = await User.findOne({ email: currentUserEmail });

        const currentUserConnections = currentUser.Connections.map(connection => connection.email);

        const regex = new RegExp(`^${searchName}`, 'i');
        const users = await User.find({
            $or: [
                { firstName: { $regex: regex } },
                { lastName: { $regex: regex } }
            ],
            email: { $nin: currentUserConnections } 
        }).select('firstName lastName email userType mobile Interests dp Requests');

        response.status(200).json(users);
    } catch (error) {
        response.status(500).json({ message: "Internal server error" });
    }
}));


// networkRouter.get('/searchQuery', expressAsyncHandler(async (request, response) => {
//     const firstName = request.query.name.split(' ')[0];
//     const lastName = request.query.name.split(' ')[1];
//     const currentUserEmail = request.query.currentUser; 

//     try {
//         const currentUser = await User.findOne({ email: currentUserEmail });

//         const currentUserConnections = currentUser.Connections.map(connection => connection.email);

//         const users = await User.find({
//             firstName: firstName,
//             lastName: lastName,
//             email: { $nin: currentUserConnections } 
//         }).select('firstName lastName email userType mobile Interests dp Requests');

//         response.status(200).json(users);
//     } catch (error) {
//         response.status(500).json({ message: "Internal server error" });
//     }
// }));


//Accept or Reject
networkRouter.put('/connectionRequest', authenticateToken,expressAsyncHandler(async (request, response) => {
    const decision = request.body.decision;
    const currentUser = request.body.currentUser;
    const actionOnUser = request.body.actionOnUser;
    try {
        if (decision === "Accept") {
            await User.findOneAndUpdate(
                { email: currentUser },
                {
                    $pull: { Requests: actionOnUser },
                    $push: { Connections: actionOnUser }
                },
                { new: true }
            );
            await User.findOneAndUpdate(
                { email: actionOnUser },
                { $push: { Connections: currentUser } },
                { new: true }
            );
        } else {
            await User.findOneAndUpdate(
                { email: currentUser },
                { $pull: { Requests: actionOnUser } },
                { new: true }
            );
        }
        response.status(200).send({ message: "Success!!!" });
    } catch (error) {
        response.status(500).send({ message: "Internal server issue" });
    }
}));

//GET REQUESTS
networkRouter.get('/requests', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const currentUser = request.query.email;
    try{
        let requests = await User.findOne({email:currentUser});
        requests = requests.Requests
        const usersWhoSentYouRequests =await User.find({
            email:{$in:requests}
        }).select('firstName lastName email dp'); 
        console.log("Requests:", usersWhoSentYouRequests)

        response.status(200).send({requests:usersWhoSentYouRequests})
    }catch(error){
        response.status(500).json({ message: "Internal server error", error: error.message });
    }
}))

// UPDATE THE REQUESTS LIST OF A USER
networkRouter.put('/requests', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const currentUser = request.body.currentUser;
    const targetUser = request.body.targetUser;
    try{
        await User.findOneAndUpdate(
            { email: targetUser },
            { $push: { Requests: currentUser} },
            { new: true }
          );

        response.status(200).send({message:"Success!!!"})
    }catch(error){
        console.error("Error Updating requests:", error);
        response.status(500).json({ message: "Internal server error", error: error.message });
    }
}))
 

// GET STUDENTS
networkRouter.get('/students', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const email = request.query.email;
    const interests = JSON.parse(request.query.interests);
    try{
        const user = await User.findOne({ email });

        const users = await User.find({
            email: { $ne: email },
            userType: "Student", 
            Interests: { $in: interests },
            email: { $nin: [...user.Connections, email] } 
          }).select('firstName lastName email userType mobile Interests dp Requests');

        console.log(users)
        const paginatedUsers = [];
        let currentUserList = [];
        let count = 0;

        users.forEach(user => {
        if (count === 6) {
            paginatedUsers.push(currentUserList);
            currentUserList = [];
            count = 0;
        }
        currentUserList.push(user);
        count++;
        });

        if (currentUserList.length > 0) {
        paginatedUsers.push(currentUserList);
        }

        response.status(200).send({paginatedUsers:paginatedUsers});
      
    }catch(error){
        console.error("Error fetching users:", error);
        response.status(500).json({ message: "Internal server error", error: error.message });
    }
}))

// GET PROFESSIONALS
networkRouter.get('/professionals', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const email = request.query.email;
    const interests = JSON.parse(request.query.interests);
    // console.log(interests)
    try{
        const user = await User.findOne({ email });

        const users = await User.find({
            email: { $ne: email },
            userType: "Employee", 
            Interests: { $in: interests },
            email: { $nin: [...user.Connections, email] } 
          }).select('firstName lastName email userType mobile Interests dp Requests');

        
        const paginatedUsers = [];
        let currentUserList = [];
        let count = 0;

        users.forEach(user => {
        if (count === 6) {
            paginatedUsers.push(currentUserList);
            currentUserList = [];
            count = 0;
        }
        currentUserList.push(user);
        count++;
        });

        if (currentUserList.length > 0) {
        paginatedUsers.push(currentUserList);
        }

        response.status(200).send({paginatedUsers:paginatedUsers});
      
    }catch(error){
        console.error("Error fetching users:", error);
        response.status(500).json({ message: "Internal server error", error: error.message });
    }
}))


module.exports = networkRouter;