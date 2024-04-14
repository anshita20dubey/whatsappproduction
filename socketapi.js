const io = require("socket.io")();
const socketapi = {
    io: io
};
const user = require('./Model/user');
const messageModel = require('./Model/message');
const groupModel = require('./Model/group');

// Add your socket.io logic here!
io.on("connection", function (socket) {

    socket.on('join-server', async userDetails => {
        // console.log(userDetails);

        const currentUser = await user.findOne({
            username: userDetails.username,
        });

        // console.log(currentUser);    
        const allGroups = await groupModel.find({
            // unn groups ko find kro jinke users array me inki id ho
            users: {
                $in: [ currentUser._id ]
            }
        });
        allGroups.forEach(group=>{
            socket.emit('group-joined',group);
        })

        await user.findOneAndUpdate({
            username: userDetails.username
        }, {
            socketId: socket.id,
        })

        let onlineUsers = await user.find({
            socketId: {
                $nin: ["", socket.id]
            }
        })
        // onlineUsers = [...onlineUsers, ...allGroups]
        onlineUsers.forEach(onlineUser => {
            socket.emit('new-user-join', {
                profileImage: onlineUser.profileImage,
                username: onlineUser.username,
            })
        })
        socket.broadcast.emit('new-user-join', userDetails);
    })

    socket.on('disconnect', async () => {
        console.log('user disconnected');

        await user.findOneAndUpdate({
            socketId: socket.id
        }, {
            socketId: "",
        })
    })

    socket.on('private-message', async messageObject => {
        await messageModel.create({
            msg: messageObject.message,
            sender: messageObject.sender,
            receiver: messageObject.receiver,
        });

        const receiver = await user.findOne({
            username: messageObject.receiver,
        });

        if(!receiver){
            // jb receiver na mile mtlb ki group me msg bhja gya h to uss group ko dhund lo 
            const group = await groupModel.findOne({
                name: messageObject.receiver,
            }).populate('users');

            if(!group) {return} // agar group nhi mila to

            group.users.forEach(user=>{
                socket.to(user.socketId).emit('receive-private-message',messageObject);
            })
        }

        if(receiver)
           socket.to(receiver.socketId).emit('receive-private-message', messageObject);

    })

    socket.on('fetch-conversation', async conversationDetails => {

        const isUser = await user.findOne({
            username: conversationDetails.receiver,
        })

        if(isUser){
            const allMessages = await messageModel.find({ // ye vli query one to one chat ke liye
                $or: [
                    {
                        sender: conversationDetails.sender, // a
                        receiver: conversationDetails.receiver, // b
                    },
                    {
                        receiver: conversationDetails.sender, // a
                        sender: conversationDetails.receiver, // b
                    }
                ]
    
            })
            socket.emit('send-conversation', allMessages);
        }else{  // ye vli query group chat ke liye
            const allMessages = await messageModel.find({
                receiver: conversationDetails.receiver,  // vo vle msgs dhund ke lao jisme receiver grp ho
            })
            socket.emit('send-conversation', allMessages);
        }
    })

    socket.on('create-new-group', async groupDetails => {

        // creating group
        const newGroup = await groupModel.create({
            name: groupDetails.groupName
        });

        // putting first user in group
        const currentUser = await user.findOne({
            username: groupDetails.sender,
        });

        newGroup.users.push(currentUser._id);
        await newGroup.save();
        
        socket.emit('group-created', newGroup);
    })

    socket.on('join-group', async joiningDetails =>{
        const group = await groupModel.findOne({
            name: joiningDetails.groupName,
        })

        const currentUser = await user.findOne({
            username: joiningDetails.sender,
        });

        group.users.push(currentUser._id);

        await group.save();

        socket.emit('group-joined',{
            profileImage: group.profileImage,
            name: group.name,
        });
    })

    console.log("A user connected");
});
// end of socket.io logic

module.exports = socketapi;