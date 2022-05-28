'use strict';
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//
//===================APPLICATION COMPONENTS=========================
class Workout{
    //public properties---latest update of js
    date=new Date();
    id = (Date.now()+ '').slice(-10);//converting date to string and selecting the last 10 digits as id
    constructor(coords,distance,duration){
        this.coords=coords  //[lat,lan]
        this.distance=distance; //in km
        this.duration=duration; //in min
    }

    _getDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}, ${this.date.getDate()}`
    }
}
//child classes of WORKOUT

//running class
class Running extends Workout{
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);//passing attributes to the superclass constructor
        
        this.type='running';
        this.cadence=cadence; 
        this._getDescription();
        this.calcPace(); // min/km
    }
    calcPace(){ // min/km
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}
//cycling class
class Cycling extends Workout{
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);

        this.type='cycling';
        this.elevationGain=elevationGain;
        this._getDescription();
        this.calcSpeed(); // km/h
    }
    calcSpeed(){
        this.speed=this.distance/(this.duration/60);// km/h
    }
}
//TEST:
// const cycle1=new Cycling([39,18],4.4,34,123);
// const run1=new Running([17,-12],4.44,32,67);
// console.log(cycle1,run1);

//===================APPLICATION ARCHITECTURE=======================
class App{
    //attributes
    #map;
    #mapEvent;
    #workoutsArray=[];
    #mapZoomLevel=13;
    //
    constructor(){
        this._getPosition();
        //retrieve info from Local Storage
        this._getLocalStorage();
        //event listener
        form.addEventListener('submit',this._newWorkout.bind(this));//binding the instance's this to _newWorkout fn call so that #map,#mapEvent and #map.Event.latlng inside can be accessible
        //
        inputType.addEventListener('change',this._toggleElevationFields)//.bind() not required here as "_toggleElevationField" isnt dealing with class instance attributes like #map; or #mapEvent;
        // move to the desired portion of the map where the selected workout exists as a marker
        containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
        // retrieve data from local storage
        
    }
    //----------------------------------
    _getPosition(){
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(err){
            console.log(err);
            alert('could not obtain location!');
        })
    }
    //-------------------------------
    _loadMap(position){
            //extracting user location
            const {latitude}=position.coords;
            const {longitude}=position.coords;
            const userCoords=[latitude,longitude];
        
            //if the coordinates are successfully fetched then execute the following leaflet api's
            //!!! here L is the namespace for all the given method, by defining the scope resolution of each method
            this.#map = L.map('map').setView(userCoords, this.#mapZoomLevel);//appends the map to be displayed in the html tag having "map" as its id
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'})
                .addTo(this.#map);
            
            //binding the current instance for #mapEvents
            this.#map.on('click',this._showForm.bind(this));//------------->> .on() leaflet's inbuilt event handler
            
            // console.log(`#mapevent val is now: ${this.#mapEvent}`);
            this.#workoutsArray.forEach(work=>{
                this._renderWorkoutMarker(work);
            })
    }
    //-------------------------------------
    _showForm(mapE){
        this.#mapEvent=mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    //-------------------------------------
    _toggleElevationFields(){
        //.closest() chooses the nearest ancestor of inputElevation and inputCadence object with a class of '.form__row'
        //toggle simply acts as a switch between current state of class and its available alternative
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    //----------------------------------
    _newWorkout(e){
        e.preventDefault();//holds the marker on map after form submission
        //input validator
        const validInp=(...inputs) => inputs.every(inp=>Number.isFinite(inp)); // isfinite returns false if value isnt a finite +ve number, even in case of no input
        
        const allPositive=(...inputs) => inputs.every(inp=> inp > 0);
        
        //Get data from the form
        const type=inputType.value;
        const distance=+inputDistance.value;
        const duration=+inputDuration.value;
        
        let workout;
        //if workout running, create a running object
        if(type === 'running'){
            const cadence=parseInt(inputCadence.value); //converting to integer as cadence was stored as a string
            //Check if data is valid

            // if(!Number.isFinite(distance) ||
            // !Number.isFinite(duration) ||
            // !Number.isFinite(cadence)) return alert('Invalid Input!');

            
            
            if(!validInp(distance,duration,cadence) || !allPositive(distance,duration,cadence)) 
                return alert('Invalid Input!');
            
            //add new object to workout array
                //Creating a new workout object of Running type 
            workout = new Running(this.#mapEvent.latlng,distance,duration,cadence);// here, this.#mapEvent.latlng === [lat,lng]
            this.#workoutsArray.push(workout);
            //TEST:
        }
        //if workout cycling, create a cycling object
        if(type === 'cycling'){
            const elevation=parseInt(inputElevation.value); //converting to integer, as elevation was stored as a string
            //Check if data is valid

            // if(!Number.isFinite(distance) ||
            // !Number.isFinite(duration) ||
            // !Number.isFinite(elevation)) return alert('Invalid Input!');

            
            
            if(!validInp(distance,duration,elevation) || !allPositive(distance,duration)) //hence as, elevation can be negative in downhill case
                return alert('Invalid Input!');
            //add new object to workout array
                //Creating a new workout object of Cycling type
            workout = new Cycling(this.#mapEvent.latlng,distance,duration,elevation);// here, this.#mapEvent.latlng === [lat,lng]
            this.#workoutsArray.push(workout);
        }
        
        //calling map marker rendering function
        this._renderWorkoutMarker(workout);
        
        // Controlling the behaviour of form after 'submit event'
        this._hideForm();
        
        // rendering workout list
        this._renderWorkoutList(workout);

        // setting local storage
        this._setLocalStorage();
    }
    
    //Marker rendering method-----------------------------------------
    _renderWorkoutMarker(workout){
        L.marker(workout.coords, {highlight: 'temporary'})
             .addTo(this.#map)
             .bindPopup(
                L.popup({
                    maxWidth:200,
                    minWidth:100,
                    autoClose:false,
                    closeButton:false,
                    closeOnClick:false,
                    className: `${workout.type}-popup`
                })
             ).setPopupContent(workout.description).openPopup();
    }

    //// rendering workout list---------------------------------
    _renderWorkoutList(workout){
        
        let html=`<li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">Dist: </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>`

        if(workout.type===`running`){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${parseInt(workout.cadence).toPrecision(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        if(workout.type === `cycling`){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${parseInt(workout.speed).toPrecision(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }
        //appending the html as a sibling in after the form
        form.insertAdjacentHTML('afterend',html);
    }

    //post submit form processing----------------------------------
    _hideForm(){
        // Controlling the behaviour of form after 'submit event'
            
            //clearing input fields
            inputDistance.value=inputDuration.value=inputElevation.value=inputCadence.value='';
            
            //bringing distance field back to focus
            inputDistance.focus();
            
            //hiding the form again.....until another map click event
            form.classList.add('hidden');
    }

    //Move the focus towards the maker related to selected workout item in the on-screen workout list
    _moveToMarker(e){
        const workoutElement = e.target.closest('.workout');

        if(!workoutElement) return;// if clicked somewhere else, simply return

        const workout = this.#workoutsArray.find(work => work.id === workoutElement.dataset.id);

        this.#map.setView(workout.coords,this.#mapZoomLevel,{animate: true,pan:{duration:1.3}});

    }

    //-------SETTING UP LOCALSTORAGE

    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workoutsArray));   
    }

    //-------------RETRIEVING FROM DATA LOCALSTORAGE

    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        
        if(!data) return; // if local storage is empty then, simply return
        
        //restoring the prototype chain for each instance retrieved from the local storage
        data.forEach(work => {
            let obj;
            if (work.type === 'running') obj = new Running();
            if (work.type === 'cycling') obj = new Cycling();
    
            Object.assign(obj, work);
            this.#workoutsArray.push(obj);
         });


        this.#workoutsArray=data;

        this.#workoutsArray.forEach(workout =>{
            this._renderWorkoutList(workout);
        });
        
    }
    //----------------localstorage and location reset
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
      }
}
//--------------------------------------start point----app creation

const app=new App();


//



