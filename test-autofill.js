
const facilities = require('./components/facilities.json');

const testCases = [
    "Karen Hospital Clinic",
    "Jubilee Centre Karen",
    "Goodlife Shell Karen",
    "Mariakani Cottage Hospital"
];

console.log("Testing auto-fill logic...");

testCases.forEach(query => {
    const f = facilities.find(item => item.properties.name === query);
    if (!f) {
        console.log(`Facility "${query}" not found.`);
        return;
    }

    console.log(`\nFacility: ${f.properties.name}`);
    console.log(`Amenity: ${f.properties.amenity}`);
    console.log(`Healthcare: ${f.properties.healthcare}`);

    let clientType = '';
    let hospitalLevel = '';

    const amenity = (f.properties.amenity || '').toLowerCase();
    const healthcare = (f.properties.healthcare || '').toLowerCase();

    if (amenity.includes('hospital') || healthcare.includes('hospital')) {
        clientType = 'hospital';
        hospitalLevel = '4';
    } else if (amenity.includes('clinic') || healthcare.includes('clinic') || amenity.includes('dispensary')) {
        clientType = 'clinic';
        hospitalLevel = '2';
    } else if (amenity.includes('pharmacy')) {
        clientType = 'other';
        hospitalLevel = 'not_applicable';
    }

    console.log(`-> Auto-filled Client Type: ${clientType}`);
    console.log(`-> Auto-filled Hospital Level: ${hospitalLevel}`);
});
