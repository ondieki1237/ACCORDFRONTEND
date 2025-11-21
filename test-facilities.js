
const facilities = require('./components/facilities.json');

const query = "Karen";
const lowerQuery = query.toLowerCase();

console.log(`Total facilities: ${facilities.length}`);

const results = facilities.filter(f => {
    const name = f.properties?.name || '';
    return name.toLowerCase().includes(lowerQuery);
}).slice(0, 10);

console.log(`Found ${results.length} results for query "${query}":`);
results.forEach(r => console.log(`- ${r.properties.name}`));
