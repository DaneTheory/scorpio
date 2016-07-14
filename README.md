# scorpio
### Transcribing Phone Calls To Set Reminders

1. Twilio transactions save audio recordings of phone conversations
2. Use speech to text analyzer api (Google or Siri or popup archive)
3. wit.ai or indico parses those audio files to highlight the following:
    1. People you talked to
    2. Numbers mentioned
    3. Locations mentioned
    4. Dates mentioned
    5. Summary of intent and content
    6. Possibly people mentioned but it's less important
4. Organizes data into a helpful format


### Routes and Models
#### Models:
User:
    contacts:
        conversations
            audio data/file
            text data
            locations, people, etc.
            words surrounding triggers
            time of conversation
    triggers
    
#### Routes:
1. get/register - registers a user to the app
2. post/register
3. get/login - logs in and renders the home page that has a list of your stored contacts
4. post/login
5. post/call - makes a request to twilio, twilio handles the call and records an audio file. We then make a request to an audio to text api. Then run that text through a text analyzer. Add results to the data model.
6. get/convo - grabs the conversation text sorted by date.
7. post/trigger - adding new trigger words or phrases to the data model.
