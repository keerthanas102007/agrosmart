const db = require("../config/db");


const Post = {


create:(data,callback)=>{

const sql =
"INSERT INTO posts(user_id,title,description,image,profit) VALUES(?,?,?,?,?)";


db.query(
sql,
[
data.user_id,
data.title,
data.description,
data.image,
data.profit
],
callback
)

},


getAll:(callback)=>{

db.query(
"SELECT * FROM posts ORDER BY created_at DESC",
callback
)

}


}


module.exports = Post;