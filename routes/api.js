require('../settings')
const express = require('express')
const translate = require('translate-google')
const list = require("../lib/listdl")
const textto = require('soundoftext-js')
const googleIt = require('google-it')
const { shortText } = require("limit-text-js")
const Canvas = require('canvas')
const TinyURL = require('tinyurl');
const emoji = require("emoji-api");
const isUrl = require("is-url")
const { ytMp4, ytMp3 } = require('../lib/y2mate')
const BitlyClient = require('bitly').BitlyClient
const canvasGif = require('canvas-gif')
const { convertStringToNumber } = require('convert-string-to-number'); 
const isImageURL = require('image-url-validator').default
const {fetchJson, getBuffer} = require('../lib/myfunc')
const Canvacord = require("canvacord");
const isNumber = require('is-number');
const User = require('../model/user');
const dataweb = require('../model/DataWeb');
const router = express.Router()



async function verificarapikey(req, res, next) {
	var apikey = req.query.apikey
	if (!apikey ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro apikey."})  

    let db = await User.findOne({apikey: apikey});
    if(db === null) {
		return res.json({ status : false, creator : `${creator}`, message : "Este apikey não existe."})  
		} else if(!db.isVerified) {
				return res.json({ status : false, creator : `${creator}`, message : "Por favor, verifique o e-mail para usar os serviços da api."})  
			} else if(db.limitApikey === 0) {
				return res.json({ status : false, creator : `${creator}`, message : "Este apikey foi expirada."})  
			}else{
        return next();
    }
}

async function limitapikey(apikey) {
       await dataweb.updateOne({}, {$inc: {  RequestToday: 1 }})
       await User.findOneAndUpdate({apikey: apikey},{$inc: { limitApikey: -1}},{upsert: true,new: true})
}





router.get('/api/dowloader/fbdown', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})  
list.fbdown(url).then(data => {
	if (!data.Normal_video ) return res.json(loghandler.noturl)
	limitapikey(req.query.apikey)
	res.json({
	status: true,
	creator: `${creator}`,
	result:	data
	})
	})
	 .catch(e => {
		res.json(loghandler.error)
})
})

router.get('/api/dowloader/twitter', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   
	
list.twitter(url).then(data => {
if (!data.video ) return res.json(loghandler.noturl)
limitapikey(req.query.apikey)
res.json({
status: true,
creator: `${creator}`,
result: data
})
})
.catch(e => {
res.json(loghandler.error)
})
})

router.get('/api/dowloader/tikok', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})  

list.musically(url).then(data => {
    if (!data) return res.json(loghandler.noturl)
	limitapikey(req.query.apikey)
	res.json({
	    status: true,
	    creator: `${creator}`,
	    result: data
	})
}).catch(e => {
	res.json(loghandler.noturl)
})
})


router.get('/api/dowloader/igstorydowloader', verificarapikey, async (req, res, next) => {
	var username = req.query.username
	if (!username ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro username."})   

	list.igstory(username).then(async (data) => {
		if (!data) return res.json(loghandler.instgram) 
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
	    })
	})
})


router.get('/api/dowloader/igdowloader', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   
	if (!/^((https|http)?:\/\/(?:www\.)?instagram\.com\/(p|tv|reel|stories)\/([^/?#&]+)).*/i.test(url)) return res.json(loghandler.noturl)

	list.igdl(url).then(async (data) => {
		if (!data ) return res.json(loghandler.instgram) 
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
	    })
	}).catch(e => {
		res.json(loghandler.noturl)
    })
})


router.get('/api/dowloader/yt', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."}) 

	var mp3 = await ytMp3(url)
	var mp4 = await ytMp4(url)
	if (!mp4 || !mp3) return res.json(loghandler.noturl)
	limitapikey(req.query.apikey)
		res.json({
			status: true,
			creator: `${creator}`,
			result:{ 
			title: mp4.title,
			desc: mp4.desc,
			thum: mp4.thumb,
			view: mp4.views,
			channel: mp4.channel,
			uploadDate: mp4.uploadDate,
			mp4:{
				result: mp4.result,
				size: mp4.size,
				quality: mp4.quality
			},
			mp3:{
				result: mp3.result,
				size: mp3.size
			}
		 }
	   })
})

router.get('/api/dowloader/soundcloud', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   
	
	list.soundcloud(url).then(data => {
		if (!data.download ) return res.json(loghandler.noturl)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
		})
	}).catch(e => {
			 res.json(loghandler.error)
    })
})

router.get('/api/dowloader/mediafire', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   

	list.mediafiredl(url).then(async (data) => {
		if (!data ) return res.json(loghandler.noturl)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
	    })
	}).catch(e => {
		res.json(loghandler.noturl)
    })
})

router.get('/api/dowloader/sfilemobi', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   

	list.sfilemobi(url).then(async (data) => {
		if (!data ) return res.json(loghandler.noturl)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
	    })
	}).catch(e => {
		res.json(loghandler.noturl)
    })
})

router.get('/api/dowloader/zippyshare', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   

	list.zippyshare(url).then(async (data) => {
		if (!data ) return res.json(loghandler.noturl)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
	    })
	}).catch(e => {
		res.json(loghandler.noturl)
    })
})

router.get('/api/dowloader/telesticker', verificarapikey, async (req, res, next) => {
	var url = req.query.url
	if (!url ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})   
	if (!url.match(/(https:\/\/t.me\/addstickers\/)/gi)) return res.json(loghandler.noturl)
	
	list.telesticker(url).then(data => {
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
		})
		})
         .catch(e => {
	 res.json(loghandler.error)
})
})



router.get('/api/textpro/pencil', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-a-sketch-text-effect-online-1044.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/glitch', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-impressive-glitch-text-effects-online-1027.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/blackpink', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-blackpink-logo-style-online-1001.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/berry', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-berry-text-effect-online-free-1033.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/neon', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/neon-light-text-effect-online-882.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})



router.get('/api/textpro/logobear', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/online-black-and-white-bear-mascot-logo-creation-1012.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/3dchristmas', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/3d-christmas-text-effect-by-name-1055.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/thunder', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/online-thunder-text-effect-generator-1031.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/3dboxtext', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/3d-box-text-effect-online-880.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/textpro/glitch2', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var text2 = req.query.text2
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2"}) 
	list.textpro("https://textpro.me/create-a-glitch-text-effect-online-free-1026.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/glitchtiktok', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var text2 = req.query.text2
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2."}) 
	list.textpro("https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/video-game-classic', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var text2 = req.query.text2
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2."}) 
	list.textpro("https://textpro.me/video-game-classic-8-bit-text-effect-1037.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/marvel-studios', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var text2 = req.query.text2
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2."}) 
	list.textpro("https://textpro.me/create-logo-style-marvel-studios-online-971.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/ninja-logo', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var text2 = req.query.text2
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2."}) 
	list.textpro("https://textpro.me/create-ninja-logo-online-935.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/green-horror', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-green-horror-style-text-effect-online-1036.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/magma', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-a-magma-hot-text-effect-online-1030.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/3d-neon-light', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-3d-neon-light-text-effect-online-1028.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/3d-orange-juice', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/create-a-3d-orange-juice-text-effect-online-1084.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/chocolate-cake', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/chocolate-cake-text-effect-890.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/textpro/strawberry', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.textpro("https://textpro.me/strawberry-text-effect-online-889.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
})
.catch((err) =>{
 res.json(loghandler.error)
})
})




router.get('/api/photooxy/flaming', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/realistic-flaming-text-effect-online-197.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/shadow-sky', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/metallic', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/other-design/create-metallic-text-glow-online-188.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/naruto', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/manga-and-anime/make-naruto-banner-online-free-378.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/pubg', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	var text2 = req.query.text2
	if (!text2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto 2."})  
	list.photooxy("https://photooxy.com/battlegrounds/make-wallpaper-battlegrounds-logo-text-146.html", [text1,text2])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/under-grass', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/make-quotes-under-grass-376.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/harry-potter', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/create-harry-potter-text-on-horror-background-178.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/flower-typography', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/art-effects/flower-typography-text-effect-164.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/picture-of-love', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/create-a-picture-of-love-message-377.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/coffee-cup', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/put-any-text-in-to-coffee-cup-371.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/butterfly', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/butterfly-text-with-reflection-effect-183.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/night-sky', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/write-stars-text-on-the-night-sky-200.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/carved-wood', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/carved-wood-effect-online-171.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})


router.get('/api/photooxy/illuminated-metallic', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/illuminated-metallic-effect-177.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})

router.get('/api/photooxy/sweet-candy', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.photooxy("https://photooxy.com/logo-and-text-effects/sweet-andy-text-online-168.html", [text1])
.then((data) =>{ 
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(data)
	})
.catch((err) =>{
 res.json(loghandler.error)
})
})



router.get('/api/soundoftext', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	var lan = req.query.lang
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	if (!lan ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de linguagem."})   

textto.sounds.create({ text: text1, voice: lan })
.then(soundUrl => {
	limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result: soundUrl
	})
}).catch(e => {
	res.json(loghandler.error)
})
})



router.get('/api/search/linkgroupwa', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
list.linkwa(text1).then((data) =>{ 
	if (!data[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
    res.json({
	status: true,
	creator: `${creator}`,
	result: data
    })
}).catch((err) =>{
       res.json(loghandler.notfound)
    })
})

router.get('/api/search/pinterest', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
list.pinterest(text1).then((data) =>{ 
	if (!data[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
    res.json({
	status: true,
	creator: `${creator}`,
	result: data
    })
    }).catch((err) =>{
        res.json(loghandler.notfound)
     })
})


router.get('/api/search/ringtone', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.ringtone(text1).then((data) =>{ 
	if (!data ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
    res.json({
	status: true,
	creator: `${creator}`,
	result: data
     })
    }).catch((err) =>{
     res.json(loghandler.notfound)
   })
})


router.get('/api/search/wikimedia', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
list.wikimedia(text1).then((data) =>{ 
	if (!data[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
    res.json({
	status: true,
	creator: `${creator}`,
	result: data
    })
     }).catch((err) =>{
       res.json(loghandler.notfound)
     })
})


router.get('/api/search/wallpaper', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.wallpaper(text1).then((data) =>{ 
	if (!data[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
   res.json({
	status: true,
	creator: `${creator}`,
	result: data
   })
   }).catch((err) =>{
     res.json(loghandler.notfound)
   })
})

router.get('/api/search/google', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   

	googleIt({'query': text1}).then(results => {
		if (!results[0] ) return res.json(loghandler.notfound)
		limitapikey(req.query.apikey)
			res.json({
				status: true,
				creator: `${creator}`,
				result: results
			})
	}).catch(e => {	
		res.json(loghandler.notfound)
	})
})

router.get('/api/search/googleimage', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   

	var gis = require('g-i-s')
gis(text1, logResults)

function logResults(error, results) {
  if (error) {
	res.json(loghandler.notfound)
  }
  else {
	if (!results[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result:  results
	})
  }
}
})


router.get('/api/search/ytplay', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."}) 

let yts = require("yt-search")
let search = await yts(text1)
let url = search.all[Math.floor(Math.random() * search.all.length)]
var mp3 = await ytMp3(url.url)
var mp4 = await ytMp4(url.url)
if (!mp4 || !mp3) return res.json(loghandler.noturl)
limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result:{ 
		title: mp4.title,
	    author: url.author,
		thum: mp4.thumb,
		view: mp4.views,
		channel: mp4.channel,
		ago: url.ago,
		timestamp: url.timestamp,
		uploadDate: mp4.uploadDate,
		desc: mp4.desc,
		mp4:{
			result: mp4.result,
			size: mp4.size,
			quality: mp4.quality
		},
		mp3:{
			result: mp3.result,
			size: mp3.size
		}
	}
	 })

})

router.get('/api/search/sticker', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.stickersearch(text1).then(data => {
		if (!data ) return res.json(loghandler.notfound)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
		})
		}).catch(e => {
	 res.json(loghandler.error)
})
})

router.get('/api/search/sfilemobi', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})   
	list.sfilemobiSearch(text1).then(data => {
		if (!data ) return res.json(loghandler.notfound)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
		})
		}).catch(e => {
	 res.json(loghandler.error)
})
})



router.get('/api/randomgambar/couplepp', verificarapikey, async (req, res, next) => {
	let resultt = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/kopel.json')
	let random = resultt[Math.floor(Math.random() * resultt.length)]
	limitapikey(req.query.apikey)
	res.json({
	status: true,
	creator: `${creator}`,
		result: {
			male: random.male,
			female: random.female
		}
	})

})


router.get('/api/randomgambar/dadu', verificarapikey, async (req, res, next) => {

	let dadu = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/dadu.json')
	let random = dadu[Math.floor(Math.random() * dadu.length)]
	var result = await getBuffer(random.result)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/webp'})
	res.send(result)
})


router.get('/api/randomgambar/coffee', verificarapikey, async (req, res, next) => {
	var result = await getBuffer('https://coffee.alexflipnote.dev/random')
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(result)
})

// Game

router.get('/api/game/tembakgambar', verificarapikey, async (req, res, next) => {
 list.tebakgambar().then((data) =>{ 
	limitapikey(req.query.apikey)	  
  res.json({
	status: true,
	creator: `${creator}`,
	result: data
   })
   }).catch((err) =>{
    res.json(loghandler.error)
  })
})

router.get('/api/game/susunkata', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/susunkata.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
})

})

router.get('/api/game/tembakbendera', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebakbendera.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
})

})


router.get('/api/game/tembakgame', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebakgame.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
})
})

router.get('/api/game/tembakkata', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebakkata.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
   })
})

router.get('/api/game/tembaklirik', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebaklirik.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
   })
})

router.get('/api/game/tembaklagu', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebaklagu.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
  })
})
router.get('/api/game/tembakkimia', verificarapikey, async (req, res, next) => {
	let ra = await fetchJson('https://raw.githubusercontent.com/AlipBot/data-rest-api/main/tebakkimia.json')
	let ha = ra[Math.floor(Math.random() * ra.length)]
	limitapikey(req.query.apikey)
  res.json({
	status: true,
	creator: `${creator}`,
	result: ha
  })
})



router.get('/api/maker/circle', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	const hasil =  await Canvacord.Canvas.circle(text);
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})


router.get('/api/maker/beautiful', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	const hasil =  await Canvacord.Canvas.beautiful(text);
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
})


router.get('/api/maker/blur', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	const hasil =  await Canvacord.Canvas.blur(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})


router.get('/api/maker/darkness', verificarapikey, async (req, res) => {
	var text = req.query.url
	var no = req.query.numero
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	if (!no ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de número."})

	var img = await isImageURL(text)
	var n = isNumber(no)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	if ( !n ) return res.json({ status : false, creator : 'delete', message : "O parâmetro número tem que ser um número."}) 

	const hasil =  await Canvacord.Canvas.darkness(text,shortText(no, 3))
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
})

router.get('/api/maker/facepalm', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.facepalm(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/invert', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.invert(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/pixelate', verificarapikey, async (req, res) => {
	var text = req.query.url
	var no = req.query.numero
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	if (!no ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro número."})

	var img = await isImageURL(text)
	var n = isNumber(no)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	if ( !n ) return res.json({ status : false, creator : 'delete', message : "O parâmetro número tem que ser um número."}) 

	const hasil =  await Canvacord.Canvas.pixelate(text,convertStringToNumber(no))
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})


router.get('/api/maker/rainbow', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.rainbow(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/resize', verificarapikey, async (req, res) => {
	var text = req.query.url
	var width = req.query.width
	var height = req.query.height

	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	if (!width ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de largura."})
	if (!height ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de tamanho."})

	let w = width
	let h = height
	if (w>1000){ w = "1000"}
	if (h>1000){ h = "1000"}

	var img = await isImageURL(text)
	var wid = isNumber(width)
	var hei = isNumber(height)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 
	if ( !wid ) return res.json({ status : false, creator : 'delete', message : "O parâmetro largura tem que ser em números."}) 
	if ( !hei ) return res.json({ status : false, creator : 'delete', message : "O parâmetro tamanho tem que ser em números."}) 

	const hasil =  await Canvacord.Canvas.resize(text, convertStringToNumber(w),  convertStringToNumber(h))
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/trigger', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.trigger(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'gif'})
	res.send(hasil)
  
})

router.get('/api/maker/wanted', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.wanted(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/wasted', verificarapikey, async (req, res) => {
	var text = req.query.url
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro url."})
	var img = await isImageURL(text)
	if ( !img ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o URL da imagem."}) 

	const hasil =  await Canvacord.Canvas.wasted(text)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(hasil)
  
})

router.get('/api/maker/attp', verificarapikey, async (req, res) => {
	var text = req.query.text
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})

const file = "./asset/image/attp.gif"

let length = text.length

var font =90

if (length>12){ font = 68}
if (length>15){ font = 58}
if (length>18){ font = 55}
if (length>19){ font = 50}
if (length>22){ font = 48}
if (length>24){ font = 38}
if (length>27){ font = 35}
if (length>30){ font = 30}
if (length>35){ font = 26}
if (length>39){ font = 25}
if (length>40){ font = 20}
if (length>49){ font = 10}
Canvas.registerFont('./asset/font/SF-Pro.ttf', { family: 'SF-Pro' })
await canvasGif(
	file,(ctx) => {
var couler = ["#ff0000","#ffe100","#33ff00","#00ffcc","#0033ff","#9500ff","#ff00ff"]
let jadi = couler[Math.floor(Math.random() * couler.length)]

		function drawStroked(text, x, y) {
			ctx.lineWidth = 5
			ctx.font = `${font}px SF-Pro`
			ctx.fillStyle = jadi
			ctx.strokeStyle = 'black'
			ctx.textAlign = 'center'
			ctx.strokeText(text, x, y)
			ctx.fillText(text, x, y)
		}
		
		drawStroked(text,290,300)

	},
	{
		coalesce: false, // whether the gif should be coalesced first (requires graphicsmagick), default: false
		delay: 0, // the delay between each frame in ms, default: 0
		repeat: 0, // how many times the GIF should repeat, default: 0 (runs forever)
		algorithm: 'octree', // the algorithm the encoder should use, default: 'neuquant',
		optimiser: false, // whether the encoder should use the in-built optimiser, default: false,
		fps: 7, // the amount of frames to render per second, default: 60
		quality: 100, // the quality of the gif, a value between 1 and 100, default: 100
	}
).then((buffer) =>{
limitapikey(req.query.apikey)
res.set({'Content-Type': 'gif'})
res.send(buffer)

})
  

router.get('/api/maker/ttp', verificarapikey, async (req, res) => {
	var text = req.query.text
	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})

	Canvas.registerFont('./asset/font/SF-Pro.ttf', { family: 'SF-Pro' })
	let length = text.length
		
	var font = 90
	if (length>12){ font = 68}
	if (length>15){ font = 58}
	if (length>18){ font = 55}
	if (length>19){ font = 50}
	if (length>22){ font = 48}
	if (length>24){ font = 38}
	if (length>27){ font = 35}
	if (length>30){ font = 30}
	if (length>35){ font = 26}
	if (length>39){ font = 25}
	if (length>40){ font = 20}
	if (length>49){ font = 10}

	var ttp = {}
	ttp.create = Canvas.createCanvas(576, 576)
	ttp.context = ttp.create.getContext('2d')
	ttp.context.font =`${font}px SF-Pro`
	ttp.context.strokeStyle = 'black'
	ttp.context.lineWidth = 3
	ttp.context.textAlign = 'center'
	ttp.context.strokeText(text, 290,300)
	ttp.context.fillStyle = 'white'
	ttp.context.fillText(text, 290,300)
	limitapikey(req.query.apikey)
		res.set({'Content-Type': 'image/png'})
		res.send(ttp.create.toBuffer())
  
})
})

router.get('/api/maker/emojimix', verificarapikey, async (req, res, next) => {
	var emoji1 = req.query.emoji1
	var emoji2 = req.query.emoji2
	if (!emoji1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro emoji1."})
	if (!emoji2 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro emoji2."})  
	
	let data = await fetchJson(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`)
	let jadi = data.results[Math.floor(Math.random() * data.results.length)]
	if (!jadi ) return res.json(loghandler.notfound)
	for (let ress of data.results) {
	resul = await getBuffer(ress.url)
	limitapikey(req.query.apikey)
	res.set({'Content-Type': 'image/png'})
	res.send(resul)
}
})

router.get('/api/maker/welcome1', verificarapikey, async (req, res, next) => {
	var name = req.query.name
    var grup = req.query.gpname
    var member = req.query.member
	var pp = req.query.pp
    var bg = req.query.bg
	
	var imgpp = await isImageURL(pp)
	var bgimg = await isImageURL(bg)

    if (!name ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro nome"})  
	if (!grup ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro nome do grupo"})  
    if (!member ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro membro"})  
	if (!pp ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro pp"})  
    if (!bg ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro bg"})  

	if ( !imgpp ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o parâmetro pp."}) 
	if ( !bgimg ) return res.json({ status : false, creator : 'delete', message : "Verifique novamente o parâmetro bg"}) 
   
    Canvas.registerFont('./asset/font/Creme.ttf', { family: 'creme' })

var welcomeCanvas = {}
welcomeCanvas.create = Canvas.createCanvas(1024, 500)
welcomeCanvas.context = welcomeCanvas.create.getContext('2d')
welcomeCanvas.context.font = '72px creme'
welcomeCanvas.context.fillStyle = '#ffffff'

await Canvas.loadImage("./asset/image/wbg1.jpg").then(async (img) => {
    welcomeCanvas.context.drawImage(img, 0, 0, 1024, 500)

})

let can = welcomeCanvas

await Canvas.loadImage(bg)
.then(bg => {
can.context.drawImage(bg, 320, 0, 709, 360)
})

    let canvas = welcomeCanvas
    canvas.context.beginPath()
    canvas.context.arc(174, 279, 115, 0, Math.PI * 2, true)
    canvas.context.stroke()
    canvas.context.fill()
    canvas.context.font = '100px creme',
    canvas.context.textAlign = 'center'
    canvas.context.fillText("Welcome", 670, 140)
    canvas.context.font = '100px Helvetica'
    canvas.context.fillText("____   ____", 670, 160)
    canvas.context.fillText("✩", 670, 215)
    canvas.context.font = '100px creme'
    canvas.context.fillText(shortText(grup, 17), 670, 300)
    canvas.context.font = '40px creme'
    canvas.context.textAlign = 'start'
    canvas.context.fillText(shortText(name, 40), 420, 420)
    canvas.context.font = '35px creme'
    canvas.context.fillText(`${shortText(member, 10)} th member`, 430, 490)
    canvas.context.beginPath()
    canvas.context.arc(174, 279, 110, 0, Math.PI * 2, true)
    canvas.context.closePath()
    canvas.context.clip()
    await Canvas.loadImage(pp)
    .then(pp => {
        canvas.context.drawImage(pp, 1, 150, 300, 300)
    })
    
	limitapikey(req.query.apikey)
    res.set({'Content-Type': 'image/png'})
    res.send(canvas.create.toBuffer())
})


router.get('/api/maker/goodbye1', verificarapikey, async (req, res, next) => {
	var name = req.query.name
    var grup = req.query.gpname
	var pp = req.query.pp
    var member = req.query.member
    var bg = req.query.bg

	var imgpp = await isImageURL(pp)
	var bgimg = await isImageURL(bg)

    if (!name ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro nome"})  
	if (!grup ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro nome do grupo"})  
    if (!member ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro membro"})  
    if (!bg ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro pp"})  
	if (!pp) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro bg"}) 
   
	if ( !imgpp ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro pp corretamente"}) 
	if ( !bgimg ) return res.json({ status : false, creator : 'delete', message : "Insira o parâmetro bg corretamente"}) 

    Canvas.registerFont('./asset/font/Creme.ttf', { family: 'creme' })

var goobyeCanvas = {}
goobyeCanvas.create = Canvas.createCanvas(1024, 500)
goobyeCanvas.context =  goobyeCanvas.create.getContext('2d')
goobyeCanvas.context.font = '72px creme'
goobyeCanvas.context.fillStyle = '#ffffff'

await Canvas.loadImage("./asset/image/wbg1.jpg").then(async (img) => {
	goobyeCanvas.context.drawImage(img, 0, 0, 1024, 500)

})

let can =  goobyeCanvas

await Canvas.loadImage(bg)
.then(bg => {
can.context.drawImage(bg, 320, 0, 709, 360)
})

    let canvas = goobyeCanvas
    canvas.context.beginPath()
    canvas.context.arc(174, 279, 115, 0, Math.PI * 2, true)
    canvas.context.stroke()
    canvas.context.fill()
    canvas.context.font = '100px creme',
    canvas.context.textAlign = 'center'
    canvas.context.fillText("GoodBye", 670, 140)
    canvas.context.font = '100px Helvetica'
    canvas.context.fillText("____   ____", 670, 160)
    canvas.context.fillText("✩", 670, 215)
    canvas.context.font = '100px creme'
    canvas.context.fillText(shortText(grup, 17), 670, 300)
    canvas.context.font = '40px creme'
    canvas.context.textAlign = 'start'
    canvas.context.fillText(shortText(name, 40), 420, 420)
    canvas.context.font = '35px creme'
    canvas.context.fillText(`${shortText(member, 10)} th member`, 430, 490)
    canvas.context.beginPath()
    canvas.context.arc(174, 279, 110, 0, Math.PI * 2, true)
    canvas.context.closePath()
    canvas.context.clip()
    await Canvas.loadImage(pp)
    .then(pp => {
        canvas.context.drawImage(pp, 1, 150, 300, 300)
    })
    
	limitapikey(req.query.apikey)
    res.set({'Content-Type': 'image/png'})
    res.send(canvas.create.toBuffer())
})



router.get('/api/linkshort/tinyurl', verificarapikey, async (req, res, next) => {
	var link = req.query.link
	if (!link ) return res.json({ status : false, creator : `${creator}`, message : ""})  

    var islink = isUrl(link)
	if (!islink ) return res.json({ status : false, creator : `${creator}`, message : "Insira o link corretamente."})  


TinyURL.shorten(link, function(link, err) {
  if (err) return res.json(loghandler.error)
  	limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result: link
		})
});
	
})

router.get('/api/linkshort/tinyurlwithalias', verificarapikey, async (req, res, next) => {
	var link = req.query.link
	var alias = req.query.alias
	if (!link ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro link."})  
	if (!alias ) return res.json({ status : false, creator : `${creator}`, message : "insira o parâmetro alias."})  

    var islink = isUrl(link)
	if (!islink ) return res.json({ status : false, creator : `${creator}`, message : "Insira o link corretamente."})  

	const data = { 'url': link, 'alias': shortText(alias, 30) }

	TinyURL.shortenWithAlias(data).then(function(link)  {	
		if (link == "Error") return res.json(loghandler.redy)
		limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result: link
		})
})
})
	
router.get('/api/linkshort/cuttly', verificarapikey, async (req, res, next) => {
	var link = req.query.link
	if (!link ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro link."})  
    var islink = isUrl(link)
	if (!islink ) return res.json({ status : false, creator : `${creator}`, message : "Insira o link corretamente."})  

	let randomapicuttly = apicuttly[Math.floor(Math.random() * apicuttly.length)]
	var hasil = await fetchJson(`https://cutt.ly/api/api.php?key=${randomapicuttly}&short=${link}`)
    if (!hasil.url ) return res.json(loghandler.noturl)
	limitapikey(req.query.apikey)
	res.json({
		status: true,
		creator: `${creator}`,
		result: hasil.url
		})
});


router.get('/api/linkshort/bitly', verificarapikey, async (req, res, next) => {
	var link = req.query.link
	if (!link ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro link."})  

	var islink = isUrl(link)
	if (!islink ) return res.json({ status : false, creator : `${creator}`, message : "Insira o link corretamente."})  

	let randomapibitly = apibitly[Math.floor(Math.random() * apibitly.length)]
	const bitly = new BitlyClient(randomapibitly)
	bitly
	.shorten(link)
	.then(function(result) {
		limitapikey(req.query.apikey)
		res.json({
			status: true,
			creator: `${creator}`,
			result : result.link
			})
	 
	})
	.catch(function(error) {
	 res.json(loghandler.error)
	});
})



router.get('/api/info/githubstalk', verificarapikey, async (req, res, next) => {
	var user = req.query.user
	if (!user ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro user."})  
	let gitstalk = await fetchJson(`https://api.github.com/users/${user}`)
	if (!gitstalk.login ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)

	res.json({
	status: true,
	creator: `${creator}`,
	result: gitstalk
	})

})

router.get('/api/info/waktuksolatmy', verificarapikey, async (req, res, next) => {
	list.watuksolatmy()
	.then(data => {
		if (!data.Tarikh ) return res.json(loghandler.error)
		limitapikey(req.query.apikey)
		res.json({
			status: true,
	        creator: `${creator}`,
			result: data
		})
		}).catch(e => {
			 res.json(loghandler.error)
})
})


router.get('/api/info/translate', verificarapikey, async (req, res, next) => {
	var text = req.query.text
    var lang = req.query.lang

	if (!text ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	if (!lang ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro linguagem"})  

	translate(text, {to: lang}).then(data => {
		limitapikey(req.query.apikey)
		res.json({
			status: true,
			creator: `${creator}`,
			result: data
		})
	}).catch(err => {
		res.json({ status : false, creator : `${creator}`, message : "insira o parâmetro linguagem corretamente. pode ver a lista de idiomas em https://cloud.google.com/translate/docs/languages."})
	})
        
})

router.get('/api/info/emoji', verificarapikey, async (req, res, next) => {
	var emoji1 = req.query.emoji
	if (!emoji1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro emoji."})
      var hasil = emoji.get(emoji1)
       if (hasil == null) return res.json({ status : false, creator : `${creator}`, message : "insira apenas 1 emoji."})
           limitapikey(req.query.apikey)
           res.json({
			status: true,
	        creator: `${creator}`,
			result: hasil
		})
})




router.get('/api/tools/ebase64', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	if (text1.length > 2048) return res.json({ status : false, creator : `${creator}`, message : "Máximo de 2.048 caracteres."})
	limitapikey(req.query.apikey)

		res.json({
			status: true,
			creator: `${creator}`,
			result: Buffer.from(text1).toString('base64')
		})

})

router.get('/api/tools/debase64', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	if (text1.length > 2048) return res.json({ status : false, creator : `${creator}`, message : "Máximo de 2.048 caracteres."})
	limitapikey(req.query.apikey)

		res.json({
			status: true,
			creator: `${creator}`,
			result: Buffer.from(text1, 'base64').toString('ascii')
		})

})

router.get('/api/tools/ebinary', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	if (text1.length > 2048) return res.json({ status : false, creator : `${creator}`, message : "Máximo de 2.048 caracteres."})

	function encodeBinary(char) {
		return char.split("").map(str => {
			 const converted = str.charCodeAt(0).toString(2);
			 return converted.padStart(8, "0");
		}).join(" ")
	 }
	 limitapikey(req.query.apikey)

		res.json({
			status: true,
			creator: `${creator}`,
			result: encodeBinary(text1)
		})
})

router.get('/api/tools/debinary', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	if (text1.length > 2048) return res.json({ status : false, creator : `${creator}`, message : "Máximo de 2.048 caracteres."})

	function decodeBinary(char) {
		return char.split(" ").map(str => String.fromCharCode(Number.parseInt(str, 2))).join("");
	 }
	 limitapikey(req.query.apikey)

		res.json({
			status: true,
			creator: `${creator}`,
			result: decodeBinary(text1)
		})

})

router.get('/api/tools/ssweb', verificarapikey, async (req, res, next) => {
	var link = req.query.link
	if (!link ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro link."})  

	var islink = isUrl(link)
	if (!islink ) return res.json({ status : false, creator : `${creator}`, message : "Insira o link corretamente."})  


	list.ssweb(link).then((data) =>{ 
		limitapikey(req.query.apikey)
		if (!data ) return res.json(loghandler.notfound)
		res.set({'Content-Type': 'image/png'})
		res.send(data)
	}).catch((err) =>{
	 res.json(loghandler.notfound)
	
	})

})

router.get('/api/tools/styletext', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto. "}) 
	var text = shortText(text1, 10000)  
	list.styletext(text)
.then((data) =>{ 
	if (!data ) return res.json(loghandler.error)
	limitapikey(req.query.apikey)

  res.json({
	status: true,
	creator: `${creator}`,
	result: data
})
})
.catch((err) =>{
 res.json(loghandler.error)

})
})



router.get('/api/islamic/surah', verificarapikey, async (req, res, next) => {
	var text1 = req.query.numero
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de número."})  
	list.surah(text1).then((data) =>{ 
	if (!data ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
		res.json({
			status: true,
			creator: `${creator}`,
			result: data
		})
}).catch((err) =>{
 res.json(loghandler.error)

})
})


router.get('/api/islamic/tafsirsurah', verificarapikey, async (req, res, next) => {
	var text1 = req.query.text
	if (!text1 ) return res.json({ status : false, creator : `${creator}`, message : "Insira o parâmetro de texto."})  
	list.tafsirsurah(text1).then((data) =>{ 
	if (!data[0] ) return res.json(loghandler.notfound)
	limitapikey(req.query.apikey)
		res.json({
			status: true,
			creator: `${creator}`,
			result: data
		})
}).catch((err) =>{
 res.json(loghandler.error)

})
})

module.exports = router