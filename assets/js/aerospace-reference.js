(() => {
  const TERMS = [
    ['ADF','Automatic Direction Finder','Navigation','Radio navigation receiver used with an NDB.'],
    ['ADS-B','Automatic Dependent Surveillance-Broadcast','Navigation','Aircraft broadcasts position and other data for surveillance and traffic awareness.'],
    ['AFM','Aircraft Flight Manual','Operations','Approved aircraft-specific operating information and limitations.'],
    ['AGL','Above Ground Level','Altitude','Height measured above the local ground surface.'],
    ['AHRS','Attitude and Heading Reference System','Avionics','Solid-state system supplying attitude and heading information to the flight displays.'],
    ['AIM','Aeronautical Information Manual','Operations','FAA reference describing operating practices, procedures, and aeronautical information.'],
    ['ALS','Approach Lighting System','Airport','Lighting system aligned with a runway approach to help transition to visual references.'],
    ['AOA','Angle of Attack','Aerodynamics','Angle between the wing chord line and the relative wind.'],
    ['AP','Autopilot','Avionics','Automatic flight-control system that can command selected aircraft axes or modes.'],
    ['ASOS','Automated Surface Observing System','Weather','Automated airport weather observing system.'],
    ['ATC','Air Traffic Control','Operations','Service that separates and sequences participating aircraft and provides traffic information.'],
    ['ATIS','Automatic Terminal Information Service','Weather','Continuous recorded terminal information including weather, runway, and airport details.'],
    ['AWOS','Automated Weather Observing System','Weather','Automated system reporting local airport weather conditions.'],
    ['CAS','Calibrated Airspeed','Performance','Indicated airspeed corrected for instrument and position error.'],
    ['CDI','Course Deviation Indicator','Navigation','Display showing lateral deviation from a selected navigation course.'],
    ['CG','Center of Gravity','Aircraft','Point through which the aircraft weight is considered to act.'],
    ['CHT','Cylinder Head Temperature','Engine','Engine parameter used to monitor cylinder thermal condition.'],
    ['COM','Communication Radio','Avionics','VHF radio used for voice communication.'],
    ['CTAF','Common Traffic Advisory Frequency','Airport','Frequency used for pilot position reports and traffic coordination at many non-towered airports.'],
    ['DA','Decision Altitude','Instrument','Altitude used on certain precision approaches to determine whether required visual references exist.'],
    ['DME','Distance Measuring Equipment','Navigation','Radio system that determines slant-range distance from a ground station.'],
    ['EGT','Exhaust Gas Temperature','Engine','Engine exhaust temperature used as an engine-management indication.'],
    ['ELT','Emergency Locator Transmitter','Safety','Aircraft emergency transmitter designed to aid search and rescue.'],
    ['FAA','Federal Aviation Administration','Operations','U.S. civil aviation authority.'],
    ['FBO','Fixed-Base Operator','Airport','Airport business that commonly provides fuel, parking, services, and facilities.'],
    ['FD','Flight Director','Avionics','Command bars or cues showing the pitch and bank guidance required to follow selected modes.'],
    ['FOD','Foreign Object Debris','Safety','Loose material that can damage aircraft, engines, or equipment.'],
    ['FPM','Feet Per Minute','Performance','Common unit for vertical speed or rate of climb/descent.'],
    ['GA','General Aviation','Operations','Civil aviation activity outside scheduled airline and military operations.'],
    ['GEO','Geostationary Earth Orbit','Space','Circular equatorial orbit with an orbital period matching Earth rotation.'],
    ['GNSS','Global Navigation Satellite System','Navigation','Satellite navigation systems such as GPS and other global constellations.'],
    ['GPS','Global Positioning System','Navigation','U.S. satellite-based positioning and navigation system.'],
    ['GS','Groundspeed','Performance','Aircraft speed relative to the ground.'],
    ['GTC','Garmin Touchscreen Controller','Avionics','Touchscreen interface used to control functions on Garmin integrated flight decks.'],
    ['HDG','Heading','Navigation','Direction the aircraft nose points, normally expressed in degrees.'],
    ['HSI','Horizontal Situation Indicator','Navigation','Integrated display of heading, course, and lateral navigation information.'],
    ['IAS','Indicated Airspeed','Performance','Airspeed shown directly on the airspeed indicator or PFD.'],
    ['ICAO','International Civil Aviation Organization','Operations','United Nations agency that develops international civil-aviation standards and practices.'],
    ['IFR','Instrument Flight Rules','Operations','Rules governing flight primarily by reference to instruments and the instrument flight system.'],
    ['ILS','Instrument Landing System','Navigation','Precision approach system providing lateral and vertical guidance.'],
    ['IMC','Instrument Meteorological Conditions','Weather','Conditions below defined visual meteorological minima.'],
    ['ISA','International Standard Atmosphere','Weather','Reference atmospheric model used for performance and engineering calculations.'],
    ['LEO','Low Earth Orbit','Space','Earth orbit generally close enough to Earth for short orbital periods and lower latency.'],
    ['LOC','Localizer','Navigation','ILS component providing lateral guidance to the runway centerline.'],
    ['L/D','Lift-to-Drag Ratio','Aerodynamics','Ratio comparing aerodynamic lift produced to aerodynamic drag.'],
    ['MAC','Mean Aerodynamic Chord','Aerodynamics','Representative wing chord used for aerodynamic and center-of-gravity references.'],
    ['MAP','Manifold Absolute Pressure','Engine','Pressure measurement used as a power-setting indication on many piston aircraft.'],
    ['MDA','Minimum Descent Altitude','Instrument','Lowest altitude authorized on certain nonprecision approaches before required visual references.'],
    ['METAR','Meteorological Aerodrome Report','Weather','Standard coded observation describing current airport weather.'],
    ['MFD','Multi-Function Display','Avionics','Flight-deck display commonly used for maps, systems, traffic, weather, and other information.'],
    ['MSL','Mean Sea Level','Altitude','Altitude referenced to mean sea level.'],
    ['NAVAID','Navigational Aid','Navigation','Ground- or space-based system that supports aircraft navigation.'],
    ['NDB','Non-Directional Beacon','Navigation','Ground radio beacon used with an ADF.'],
    ['NM','Nautical Mile','Navigation','Distance unit equal to 1,852 meters.'],
    ['NOTAM','Notice to Air Missions','Operations','Time-sensitive information about hazards, changes, or conditions affecting flight operations.'],
    ['OAT','Outside Air Temperature','Weather','Ambient air temperature outside the aircraft.'],
    ['PAPI','Precision Approach Path Indicator','Airport','Runway light system giving visual glide-path information.'],
    ['PFD','Primary Flight Display','Avionics','Main electronic display for attitude, airspeed, altitude, heading, and flight guidance.'],
    ['POH',"Pilot's Operating Handbook",'Aircraft','Aircraft operating handbook containing limitations, procedures, systems, and performance information.'],
    ['RA','Radio Altimeter','Altitude','System measuring height above terrain using radio energy, primarily at lower altitudes.'],
    ['RCS','Reaction Control System','Space','Thruster system used to control spacecraft attitude or small translational motions.'],
    ['RNAV','Area Navigation','Navigation','Navigation method allowing flight on desired paths within the coverage of suitable navigation sources.'],
    ['RPM','Revolutions Per Minute','Engine','Rotational-speed measurement used for engines and propellers.'],
    ['SID','Standard Instrument Departure','Instrument','Published IFR departure procedure.'],
    ['STAR','Standard Terminal Arrival Route','Instrument','Published IFR arrival route used to transition toward the terminal area.'],
    ['TAF','Terminal Aerodrome Forecast','Weather','Coded forecast of expected weather conditions at an airport.'],
    ['TAS','True Airspeed','Performance','Aircraft speed through the surrounding air mass after correcting for atmospheric effects.'],
    ['TFR','Temporary Flight Restriction','Operations','Temporary restriction on flight operations in a defined area.'],
    ['TRUST','The Recreational UAS Safety Test','UAS','FAA-required aeronautical knowledge and safety test for recreational drone flyers in the U.S.'],
    ['UAS','Unmanned Aircraft System','UAS','Unmanned aircraft plus the supporting control, communication, and operational components.'],
    ['UAV','Unmanned Aerial Vehicle','UAS','Common term for an unmanned aircraft; UAS is broader because it includes the full system.'],
    ['VASI','Visual Approach Slope Indicator','Airport','Runway lighting system providing visual approach-slope information.'],
    ['VFR','Visual Flight Rules','Operations','Rules for flight in weather conditions that allow primary visual reference outside the aircraft.'],
    ['VMC','Visual Meteorological Conditions','Weather','Weather conditions meeting specified visibility and cloud-clearance criteria.'],
    ['VOR','VHF Omnidirectional Range','Navigation','Ground-based radio navigation system providing magnetic bearing information.'],
    ['VSI','Vertical Speed Indicator','Avionics','Instrument or PFD tape showing rate of climb or descent.'],
    ['WX','Weather','Weather','Common aviation abbreviation for weather.'],
    ['XTK','Cross-Track Error','Navigation','Lateral distance between the aircraft and the desired course or track.']
  ];
  const categoryOrder=['All','Avionics','Navigation','Aerodynamics','Weather','Operations','Performance','Aircraft','Engine','Airport','Instrument','Altitude','Safety','UAS','Space'];
  const esc=(s='')=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize=(s='')=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function init(){
    const grid=document.querySelector('#aeroGlossaryGrid');
    const input=document.querySelector('#aeroReferenceSearch');
    const filters=document.querySelector('#aeroReferenceFilters');
    const count=document.querySelector('#aeroReferenceCount');
    const empty=document.querySelector('#aeroReferenceEmpty');
    if(!grid||!input||!filters) return;
    let active='All';
    filters.innerHTML=categoryOrder.map((cat,i)=>'<button class="aero-ref-filter'+(i===0?' active':'')+'" type="button" data-category="'+esc(cat)+'">'+esc(cat)+'</button>').join('');

    const render=()=>{
      const q=normalize(input.value);
      const rows=TERMS.filter(([code,name,category,description])=>{
        const categoryMatch=active==='All'||category===active;
        const text=normalize(code+' '+name+' '+category+' '+description);
        return categoryMatch && (!q||q.split(' ').every(token=>text.includes(token)));
      }).sort((a,b)=>a[0].localeCompare(b[0]));

      grid.innerHTML=rows.map(([code,name,category,description]) =>
        '<article class="aero-term">'+
          '<div class="aero-term-head"><span class="aero-term-code">'+esc(code)+'</span><span class="aero-term-category">'+esc(category)+'</span></div>'+
          '<div class="aero-term-name">'+esc(name)+'</div>'+
          '<p>'+esc(description)+'</p>'+
        '</article>'
      ).join('');
      count.textContent=rows.length+' reference'+(rows.length===1?'':'s');
      empty.hidden=rows.length!==0;
    };

    filters.addEventListener('click',e=>{
      const btn=e.target.closest('[data-category]');
      if(!btn) return;
      active=btn.dataset.category;
      filters.querySelectorAll('.aero-ref-filter').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    });
    input.addEventListener('input',render);
    render();

    document.querySelectorAll('.aero-ref-nav a[href^="#"]').forEach(a=>{
      a.addEventListener('click',e=>{
        const target=document.querySelector(a.getAttribute('href'));
        if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
