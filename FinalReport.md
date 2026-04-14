Project summary: 
Sympos Garden Design allows users to design virtual gardens and learn strategies to help them become successful gardeners. 
They can add plants to a garden, learn about the plants, and plan where they want to plant things in their garden, 
and directly see how their placement of the plant works in the system (good/alright/or bad placement).  
My Vision: <img width="668" height="692" alt="Permaculture_land_design_drawing" src="https://github.com/user-attachments/assets/7784416b-0b00-4b2c-b2b0-bcc4887b43f4" />

<img width="728" height="369" alt="Screenshot 2026-04-01 at 1 55 30 PM" src="https://github.com/user-attachments/assets/25bc0a5a-1c15-40e3-b033-c2191c794539" />
Prototype Demo video and example images below. https://www.figma.com/design/AjwitH7FEGzUA4l27eiBWP/Sympos-Garden-Design--Investigation-8?node-id=4-4&p=f&t=YpCj0Ia5WIEjWQVC-0

https://github.com/user-attachments/assets/9eb8d0a5-4c34-451b-8795-f0e2e11c5b3f

<img width="1151" height="507" alt="Screenshot 2026-04-07 at 12 59 54 PM" src="https://github.com/user-attachments/assets/5f06ab79-867a-436a-a917-24b52d01a131" />
<img width="991" height="781" alt="Screenshot 2026-04-07 at 12 59 15 PM" src="https://github.com/user-attachments/assets/68609b49-768f-42ec-97a5-1489afe6c852" />

What did I learn? --> During this project, I learned how to make a prototype with Figma, how to use Claude AI to make the mainframe for an app idea,
and how to integrate AI into my app for users to benefit from it on the app. 


My app uses AI to help find the user's gardening zone, looking back I would probably redo this by having gardening zones be hardcoded in the database and have the users enter their Country and or state,
and give a response based on the info in the database instead of relying on AI to find the answer.
This could make it more consistent and help scale the product so I don't have to spend so much money if I have many users all at once.
I used AI to help me build the main frame for my app, it used mostly react. I wanted to use claude to help me build it in part because I wanted to see how what it could do, 
and I was excited to see my product somewhat working. I spent the majority of my time on the prototype and making my schema. I had a really fun time planning out the plants,
and coming up with new ideas to add to my design, like the badges that tell the user if the plant is happpy or sad based on its placement and how much sunlight it recieves.
I was interested in this project because, I love plants and one day want to be a permaculture designer, to help people plan homesteads, land, and garden and animal systems. 


Failover: If the server crashes, my app would just go down. If I want to make this bigger, I would use something like PM2 to automatically restart the app.
Scaling: Since the server doesn't store anything in memory between requests, I could run multiple copies of it behind a load balancer if traffic got heavy.
Performance: Plant data rarely changes, so caching it would help a lot, and the database queries could be faster with better indexes.
Authentication: Passwords are basically just encoded, not encrypted, and the app trusts whoever says they're logged in, so it would need some work to make this better if I want to make this app a real thing.
Concurrency: Node.js handles multiple users at the same time naturally through async/await, so this mostly just works for free.



