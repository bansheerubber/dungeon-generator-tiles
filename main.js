const express = require("express")
const fs = require("fs")

const app = express()
const metadataRaw = fs.readFileSync("tiles/tile_data").toString()
const metadataSplit = metadataRaw.split("\n")
const metadata = {
	imageName: metadataSplit[0],
	maxXIndex: parseInt(metadataSplit[1].split(" ")[0]),
	maxYIndex: parseInt(metadataSplit[1].split(" ")[1]),
	pictureWidth: parseInt(metadataSplit[2].split(" ")[0]),
	pictureHeight: parseInt(metadataSplit[2].split(" ")[1]),
	tileSize: parseInt(metadataSplit[3]),
}
const ipRequestMap = {}
const ipBan = {}

app.get("/tile", (request, response) => {
	const ip = request.connection.remoteAddress

	// rate limiting
	if(
		(
			ipRequestMap[ip]
			&& Date.now() - ipRequestMap[ip] < 200
		) || (
			ipRequestMap[ip]
			&& Date.now() - ipBan[ip] < 60000 // ban people for an entire minute if they're downloading too fast
		)
	) {
		response.send("")
		ipBan[ip] = Date.now()
		return
	}
	ipRequestMap[ip] = Date.now()
	
	const x = parseInt(request.query.x)
	const y = parseInt(request.query.y)
	const pattern = /^[0-9]+$/
	const path = `tiles/${metadata.imageName}_${x}_${y}.png`

	if(
		request.query.x
		&& request.query.y
		&& request.query.x.match(pattern)
		&& request.query.y.match(pattern)
		&& !isNaN(x)
		&& !isNaN(y)
		&& fs.existsSync(path)
	) {
		response.setHeader("content-type", "image/png")
		response.setHeader("content-length", fs.statSync(path)["size"]);
		response.setHeader("content-disposition", `inline; filename="${metadata.imageName}_${x}_${y}.png"`);

		fs.createReadStream(path).pipe(response)
	}
	else {
		response.send("")
	}
})

app.get("/tile_metadata", (request, response) => {
	response.send(`${metadata.maxXIndex} ${metadata.maxYIndex} ${metadata.pictureWidth} ${metadata.pictureHeight} ${metadata.tileSize}`)
})

app.listen(27999, () => {
	console.log("Listening on 27999")
})