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
With Phone:
    get/register
    get/login
    get/convo
    post/contact
    post/trigger
    
