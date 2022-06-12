process.env.token = "OTU3NDA5NzMwOTU4MDg2MjU0.G8fiDB.vEJyA6lUZlO85iggEknVETpm9m5aC2-5tzsfsg";

const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./shards/iris.js", { token: process.env.token });

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();

// Moonlight[] you're a cutie :3
