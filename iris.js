
const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./shards/iris.js", { token: process.env.token });

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();

// Moonlight[] you're a cutie :3
