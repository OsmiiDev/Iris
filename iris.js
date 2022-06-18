// eslint-disable-next-line
process.env.token = "OTU3NDA5NzMwOTU4MDg2MjU0.GwdAKi.LE64O76EYOD3A1LE4wKK9y9gvLDtJuZypJjcNY";

const {ShardingManager} = require("discord.js");

const manager = new ShardingManager("./src/iris.js", {token: process.env.token});

manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

manager.spawn();

// Moonlight[] you're a cutie :3
