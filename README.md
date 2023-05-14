# GraphQL-Backend-Project
GraphQL-Backend-Project
# Backend - GraphQL with SST & Cloudflare

## Learning basics of GraphQL

1. How to GraphQL to learn the GraphQL Spec - [https://www.howtographql.com/](https://www.howtographql.com/)
2. Leveraging the Guild’s ecosystem to build GraphQL servers with exposure to two key tools:
    1. GraphQL Yoga: [https://the-guild.dev/graphql/yoga-server](https://the-guild.dev/graphql/yoga-server)
    2. GraphQL Envelope: [https://the-guild.dev/graphql/envelop](https://the-guild.dev/graphql/envelop)

## Learning the platform

1. Building a GraphQL + DynamoDB App with InfraStructure as Code with Serverless Stack
    1. Refer: 
        1. [https://sst.dev/examples/how-to-use-dynamodb-in-your-serverless-app.html](https://sst.dev/examples/how-to-use-dynamodb-in-your-serverless-app.html)
        2. [https://sst.dev/examples/how-to-create-an-apollo-graphql-api-with-serverless.html](https://sst.dev/examples/how-to-create-an-apollo-graphql-api-with-serverless.html)
        3. Use Yoga + Envelope for the server
2. Learning Cloudflare’s Runtime with following use-cases:
    1. Building GraphQL Endpoints with Workers
    2. Building Reverse Lookup + Caching infra with KV
    3. Building SSR powered pages with Astro

## Project:

1. Plan out an application just like OSlash
    1. Login / Register a user
    2. Create a Shortcut, edit & delete
        1. validation for urls
    3. If I go to a shortcut → corresponding url
2. Building Envelope plugins
    1. Authentication
    2. Access Control
    3. Metrics
        1. Response Times of all the queries
        2. Success/Error Rate of the queries
    4. ErrorHandling

## Evaluation Project:

1. Building a real-time application with GraphQL + SSE
    
    Server-Sent Events can send updates to clients directly. Ref with a working example: [https://javascript.info/server-sent-events](https://javascript.info/server-sent-events)
    
    **Problem**: 
    
    1. The web page will display a list of shortcuts of the user (queried from the graphql server)
    2. When the shortcut gets updated / deleted, the corresponding item should automatically get updated / removed from the list on the web page without any page refresh
    
    **Hint**: GraphQL & SSE can be two separate servers - need not be together
