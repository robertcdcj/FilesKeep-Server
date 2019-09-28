const Folder = require("../models/Folder");

// a helper that recursively searches if an user has access permission on a specified entry
module.exports.entrySharedWithUser = (entry, user) => {
    if (entry.publicShare === true || (user && entry.privateShare && entry.privateShare.includes(user.email))) {
        // the current entry is either publicly shared or privately shared with the user
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    } else if (entry.parentId === "") {
        // we have reached the root folder of the sharer
        // the user in question does not have access permission on the specified entry
        return new Promise((resolve, reject) => {
            resolve(false);
        });
    } else {
        // the user does not have access permission on this specific entry
        // recursively check this entry's ancestors on access permission for this user
        return Folder.findById(entry.parentId).then((parentEntry, err) => {
            if (err || !parentEntry) {
                // could not find/access parent folder. Deny access
                return false;
            } else {
                // recursively check ancestors for access permission
                return entrySharedWithUser(parentEntry, user);
            }
        });
    }
};