const $ = require('cheerio')
const axios = require('axios').default
const mysql = require('mysql')
const puppet = require('puppeteer')

const connection = mysql.createConnection({host: 'localhost', user: 'root', password:'', database: 'scraping'})

try{
    connection.connect();
}catch(e){
    console.log(e);
}


async function storeData(data) {
    return new Promise((resolve, reject) => {
        connection.query({sql: "INSERT INTO products VALUES(?, ?, ?, ?, ?)", values: data}, (err, res, fields) => {
            if( err ){
                reject(console.log(err));
                console.log('Something went wrong');
            }

            resolve(true)
            
        })
    })
}

async function storeUPC(){
    // connection.query({sql: 'SELECT * FROM products'}, (err, result, fields) => {
    //     console.log(fields)
    // })

    // Read model from database
    // Call Get UPC
    // Store the value back to database
}

async function getUPC(model){

    if( !model ){
        return false;
    }

    const browser = await puppet.launch({headless: false});
    const page = await browser.newPage()
    await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
    await page.setViewport({
        width:1366,
        height:768
    })

    try{
        console.log(`Opening page and searching for ${model} Model  ...`);
        await page.goto('https://www.ajmadison.com/cgi-bin/ajmadison/' + model + '.html', {timeout: 99999999});
        
        // Checking element
        await page.type('.search-field__input', model);
        // console.log(await page.evaluate((e) => document.body.innerHTML))
        
        // const input_search = await page.type('.search-field__input', model);
        // console.log('Submiting form ...')
        // const search_button = await page.$('.search-field__submit');
        // await search_button.evaluate((e) => 
        //     e.click()
        // );
           
        // console.log('Looking for UPC ...')
        // await page.waitForNavigation({timeout: 999999999, waitUntil: 'networkidle2'});
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);

        let spans = await $('.px1',  $.parseHTML(bodyHTML)).toArray()
        let upc = spans.filter((e) => {
            if($(e).text().search('UPC') > -1){
                return true;
            }
            
            return false;
        })
        
        if( upc.length == 1 ){
            let upc_number = await parseInt($(upc[0]).text().split('UPC:')[1]);
            console.log(`Model ${model} with UPC ${upc_number}`)
            return upc_number;
        }

        console.log(`Model ${model} UPC number not found`)
        return 0;
        

    }catch(e){
        console.log(e.message)
        return 0;
    }

}


async function requestPage(url){

    return new Promise(async (resolve, reject) => {

        let body = await axios.get(url);
        let elements = await $('product_specs', $.xml(body)).toArray()
        elements.forEach( async (e) => {
            var model = $('pn', e).text()
            var brand = $('brand_name', e).text()
            var price = $('map', e).text() || 0;
            
            console.log(await storeData([null, model, brand, price, null]));
            var upc = await getUPC(model)
            console.log(upc)
        })

        resolve()

        })

}

(async function(){
    console.log('Start Scraping...')
    await requestPage("http://api.slymanbros.slymanmedia.com/storage/XML/4936_SLYMANBROS_SITE_SPECS_COYOTE.XML");
    await storeUPC();
    console.log('Done!')
})()


 

    

    