const mongoose = require("mongoose")
const { CARD_TYPE } = require("../utils/constant")
const Schema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'account',
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    card_no:{
        type:String,
        required:true
    },

    // CHANGE 1: Number -> String (bcrypt hash is a string)
    // CHANGE 2: select:false added (never return cvv in queries)
    cvv:{
        type:String,        // was: Number
        required:true,
        select:false        // added: never exposed in API responses
    },

    // CHANGE 3: Number -> String (bcrypt hash is a string)
    pin:{
        type:String,        // was: Number
        required:true
    },

    card_type:{
        type:String,
        required:true,
        enum:Object.keys(CARD_TYPE)
    },
    expiry:{
        type:Date,
        required:true
    },

    // CHANGE 4: New field added for card blocking after wrong PIN attempts
    is_blocked:{            // added: didn't exist before
        type:Boolean,
        default:false
    }

},{
    timestamps:true
})

const model = mongoose.model("atm",Schema)

exports.ATMmodel = model