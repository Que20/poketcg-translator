const EN = 'en'
const JA = 'ja'
const FR = 'fr'

const translateTypeFr = (type) => {
    switch (type) {	
        case "Colorless": return "Incolore"
        case "Darkness": return "Obscurité"
        case "Dragon": return "Dragon"
        case "Fairy": return "Fée"
        case "Fighting": return "Combat"
        case "Fire": return "Feu"
        case "Grass": return "Plante"
        case "Lightning": return "Électrique"
        case "Metal": return "Métal"
        case "Psychic": return "Psy"
        case "Water": return "Eau"
        default: return ""
    }
}

const translateTypeEn = (type) => {
    switch (type) {	
        case "Incolore": return "Colorless";
        case "Obscurité": return "Darkness";
        case "Dragon": return "Dragon";
        case "Fée": return "Fairy";
        case "Combat": return "Fighting";
        case "Feu": return "Fire";
        case "Plante": return "Grass";
        case "Électrique": return "Lightning";
        case "Métal": return "Metal";
        case "Psy": return "Psychic";
        case "Eau": return "Water";
        default: return "";
    }
}

const retreiveCard = async (set, id, lang) => {
    let card = `${set}-${id}`
    const req = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${card}`)
    const data = await req.json()
    return data
}

const translateJaPokemonName = async (name, lang) => {
    const fromReq = await fetch('./data/ja.json')
    const toReq = await fetch (`./data/${lang}.json`)
    const fromData = await fromReq.json()
    const toData = await toReq.json()
    return toData[fromData.indexOf(name)]
}

const searchForSimilarCard = async (name, hp, type, lang, attacks) => {
    const newType = lang != EN ? translateTypeFr(type) : type
    const req = await fetch(`https://api.tcgdex.net/v2/${lang}/cards?name=${name}&hp=${hp}&types=${newType}`)
    const data = await req.json()
    if (data.length == 0) {
        console.log(req.url)
        if(name.includes(' ')) {
            return await searchForSimilarCard(name.replaceAll(' ', '-'), hp, type, lang, attacks)
        }
    }

    for (const result of data) {
        let set = result.id.split('-')[0]
        let id = result.id.split('-')[1]
        const card = await retreiveCard(set, id, lang)
        if ((card.status ?? 200) != 404 && (card.attacks.length == attacks.length)) {
            const damages = card.attacks.map(e => e.damage)
            const expectedDamages = attacks.map(e => e.damage)
            if (arraysEqual(damages, expectedDamages)) {
                return card
            }
        }
    }
    return undefined
}

const showCardNotFound = () => {
    const error = document.createElement('div')
    error.className = "p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
    error.textContent = "Card not found"
    
    const cardErr = document.getElementById('card-error')
    cardErr.innerHTML = ''
    cardErr.appendChild(error)
}

const showTranslationNotFound = () => {
    const error = document.createElement('div')
    error.className = "p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
    error.textContent = "No translation found for this card"
    
    const cardErr = document.getElementById('card-error')
    cardErr.innerHTML = ''
    cardErr.appendChild(error)
}

const showCardDetails = (card, lang) => {
    const atkDiv = document.getElementById('atk');
    atkDiv.innerHTML = '';
    
    const cardErr = document.getElementById('card-error')
    cardErr.innerHTML = ''

    card.attacks.forEach(attack => {
        const attackDiv = document.createElement('div');
        attackDiv.className = 'attack';

        const energyDiv = document.createElement('div');
        energyDiv.className = 'flex';

        (attack.cost ?? []).forEach(energy => {
            let energyImgFile = lang === EN ? energy.toLowerCase()+'.png' : translateTypeEn(energy).toLowerCase()+'.png'
            const img = document.createElement('img')
            img.setAttribute('src', './assets/'+energyImgFile)
            img.className = 'size-5 mr-2'
            energyDiv.appendChild(img)
        })

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium text-gray-800';
        nameSpan.textContent = attack.name;

        const damageSpan = document.createElement('span');
        damageSpan.className = 'font-bold text-gray-900';
        damageSpan.textContent = attack.damage;

        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(damageSpan);

        const descriptionP = document.createElement('p');
        descriptionP.className = 'text-gray-600';
        descriptionP.textContent = attack.effect ?? "";

        const separator = document.createElement('hr');
        separator.className = 'my-2 border-gray-300';
        
        attackDiv.appendChild(energyDiv)
        attackDiv.appendChild(headerDiv);
        attackDiv.appendChild(descriptionP);

        if (card.attacks.indexOf(attack) !== card.attacks.length - 1) {
            attackDiv.appendChild(separator);
        }

        atkDiv.appendChild(attackDiv);
    });

    document.getElementById('card-name').textContent = card.name
}

const load = async (set, id) => {
    let jaCard = await retreiveCard(set, id, JA)
    if ((jaCard.status ?? 200) == 404 ) {
        showCardNotFound()
        return
    }
    let translatedLang = document.getElementById('lang').value
    let translatedName = await translateJaPokemonName(jaCard.name.replaceAll((jaCard.suffix ?? "").toLowerCase(), ''), translatedLang)
    if (translatedName == undefined) {
        showCardNotFound()
        return
    }
    let translatedCard = await searchForSimilarCard(`${translatedName} ${jaCard.suffix ?? ""}`.trim(), jaCard.hp, jaCard.types[0], translatedLang, jaCard.attacks)
    if (translatedCard == undefined) {
        showTranslationNotFound()
        return
    }
    showCardDetails(translatedCard, translatedLang)
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
