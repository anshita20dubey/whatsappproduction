const mongoose = require('mongoose');
const plm = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    username: String,
    profileImage: {
        type: String,
        default: `https://imgs.search.brave.com/0bM_YGELGhDRpkha170xdj62rM1gANg5mUFtcD3Jcqw/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzJmLzU5/L2VmLzJmNTllZjc0/M2ZkYjliZmNmN2Yw/YTIxYjYzYTAwZjdl/LmpwZw `
    },
    socketId: String,
});

userSchema.plugin(plm);

module.exports = mongoose.model('user',userSchema);