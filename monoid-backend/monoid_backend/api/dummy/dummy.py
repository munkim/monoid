from pydantic import BaseModel
from fastapi import FastAPI, APIRouter
app = FastAPI()

router = APIRouter()

@router.get("/food-recommendation")
async def recommend(
    query: str,
    num_products: int = 3,
):  
    products = [
        {
            "product_name": "Classic Pastrami Sandwich",
            "description": "Sliced pastrami piled high on rye bread, served with mustard."
        },
        {
            "product_name": "Bagel with Lox",
            "description": "A fresh bagel topped with cream cheese, smoked salmon, capers, and red onion."
        },
        {
            "product_name": "Egg Salad Sandwich",
            "description": "Homemade egg salad served on white or whole-grain bread, with lettuce and tomato."
        },
        {
            "product_name": "Matzo Ball Soup",
            "description": "Chicken broth with fluffy matzo balls, carrots, and celery."
        },
        {
            "product_name": "Reuben Sandwich",
            "description": "Corned beef, Swiss cheese, sauerkraut, and Russian dressing on grilled rye bread."
        },
        {
            "product_name": "Italian Sub",
            "description": "Salami, ham, provolone cheese, lettuce, tomato, and Italian dressing on a sub roll."
        },
        {
            "product_name": "Knish",
            "description": "A baked or fried pastry filled with potato, meat, or cheese."
        },
        {
            "product_name": "Black and White Cookie",
            "description": "A thick, cake-like cookie with half chocolate and half vanilla icing."
        },
        {
            "product_name": "Chopped Liver",
            "description": "A spread made from liver, onions, and hard-boiled eggs, served with rye bread or crackers."
        },
        {
            "product_name": "Tuna Melt",
            "description": "Tuna salad and melted cheese on toasted bread, served with a pickle on the side."
        }
    ]


    return products[:num_products]



class PlaceOrderRequest(BaseModel):
    product_id: int
    address: str

@router.get("/customer-support")
async def customer_support():
    qna = """
1. What are the daily specials at the deli?
Answer: Our daily specials change frequently to offer fresh and seasonal options. Please visit our website or call the shop directly to find out today's specials. You can also sign up for our newsletter to receive updates on our menu.

2. Do you offer catering services for events?
Answer: Yes, we provide catering services for various events, including parties, meetings, and gatherings. Our catering menu includes a wide selection of sandwiches, salads, and platters. Please contact us at least 48 hours in advance to discuss your specific needs and to place an order.

3. Can I place an order online for pickup or delivery?
Answer: Absolutely! You can place an order online through our website or mobile app for pickup or delivery. Simply browse our menu, select your items, and choose a pickup time or delivery address. If you have any special requests or dietary restrictions, please include them in the notes section of your order, or call us directly to ensure we can accommodate your needs.

4. Who are the owners of the deli?
Answer: Mun Kim, Gloria Budiman, and Edwin Jain are the owners of this deli.

5. Whats the story behind this deli?
Our deli was founded in 1995 by Mun Kim, Gloria Budiman, and Edwin Jain, three friends who are super technical in coding found love for food and community. 
Mun, a director of engineering, had always dreamed of opening a deli that would serve not just food, but also a sense of community. 
Gloria, with her coding skills, saw the potential for a deli that could offer something unique to the neighborhood. 
Edwin, a customer whisperer, attracted a lot of engineers and business leaders to try our deli.

6. What are your hours of operation?
Answer: We are open from 7:00 AM to 9:00 PM, Monday through Saturday, and from 8:00 AM to 8:00 PM on Sundays.

7. Do you have vegetarian or vegan options?
Answer: Yes, we offer a variety of vegetarian and vegan options, including salads, sandwiches, and soups. Please check our menu or ask our staff for more details.

8. Do you offer gluten-free options?
Answer: Yes, we have a selection of gluten-free items on our menu, including gluten-free bread for sandwiches. Please inform our staff of any dietary restrictions so we can best accommodate you.

"""
    
    return qna


class FlightsRequestBody(BaseModel):
    num_passengers: int
    flight_class: str


@router.get("/flights")
async def get_all_possible_flights(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    num_flights: int,
): 
    # Given the origin and destination, return all possible flights

    # Hard code all possible flights
    all_possible_flights = [
        # One departing in the morning 
        {
            "flight_code": "UA2001",
            "origin": origin,
            "destination": destination,
            "airline": "United",
            "departure_time": f"{start_date}T08:00:00",
            "arrival_time": f"{start_date}T16:00:00",
            "price": 255.00
        },
        # One departing in the afternoon
        {
            "flight_code": "DL779",
            "origin": origin,
            "destination": destination,
            "airline": "Delta",
            "departure_time": f"{start_date}T13:00:00",
            "arrival_time": f"{start_date}T21:00:00",
            "price": 285.00
        },
        # One that departs at night
        {
            "flight_code": "BA116",
            "origin": origin,
            "destination": destination,
            "airline": "Jet Blue",
            "departure_time": f"{start_date}T15:00:00",
            "arrival_time": f"{start_date}T23:00:00",
            "price": 200.00
        },
        # One departing in the morning
        {
            "flight_code": "UA2032",
            "origin": origin,
            "destination": destination,
            "airline": "United",
            "departure_time": f"{end_date}T08:00:00",
            "arrival_time": f"{end_date}T16:00:00",
            "price": 245.00
        },
        # One departing in the afternoon
        {
            "flight_code": "DL945",
            "origin": origin,
            "destination": destination,
            "airline": "Delta",
            "departure_time": f"{end_date}T13:00:00",
            "arrival_time": f"{end_date}T21:00:00",
            "price": 265.00
        },
        # One that departs at night
        {
            "flight_code": "BA942",
            "origin": origin,
            "destination": destination,
            "airline": "Jet Blue",
            "departure_time": f"{end_date}T15:00:00",
            "arrival_time": f"{end_date}T23:00:00",
            "price": 210.00
        }
    ]

    return all_possible_flights[:num_flights]


@router.get("/hotels")
async def get_all_possible_hotels(
    location: str,
    checkin_date: str,
    checkout_date: str,
    num_guests: int,
): 
    # Given the origin and destination, return all possible flights

    # Hard code all possible flights
    all_possible_hotels = [
        # One departing in the morning 
        {
            "hotel_id": 1,
            "location": location,
            "hotel_name": "Sheraton Hotel",
            "checkin_datetime": checkin_date,
            "checkout_datetime": checkout_date,
            "price_per_night": 189.00
        },
        {
            "hotel_id": 2,
            "location": location,
            "hotel_name": "Marriott",
            "checkin_datetime": checkin_date,
            "checkout_datetime": checkout_date,
            "price_per_night": 299.00
        },
        {
            "hotel_id": 3,
            "location": location,
            "hotel_name": "Four Seasons",
            "checkin_datetime": checkin_date,
            "checkout_datetime": checkout_date,
            "price_per_night": 659.00
        }
    ]

    return all_possible_hotels


class FlightsBookingRequestBody(BaseModel):
    flight_code: str
    num_passengers: int
    flight_class: str
    
@router.post("/flights")
async def book_flight(
    body: FlightsBookingRequestBody,
):
    # Given the origin and destination, return all possible flights

    return {
        "message": "Successfully booked flight",
        "flight_code": body.flight_code,
        "confirmation_code": "ASDF4950",
        "airline": "United",
        "departure_time": f"T13:00:00",
        "arrival_time": f"2023-11-11T21:00:00",
        "num_passengers": body.num_passengers,
        "flight_class": body.flight_class,
        "total_cost": 255.00 * body.num_passengers
    }


class HotelBookingRequestBody(BaseModel):
    hotel_id: int
    checkin_date: str
    checkout_date: str
    
@router.post("/hotels")
async def book_hotel(
    body: HotelBookingRequestBody,
):
    # Given the origin and destination, return all possible flights

    return {
        "message": "Successfully booked hotel",
        "hotel_id": body.hotel_id,
        "confirmation_code": "QWER590403",
        "checkin_date": body.checkin_date,
        "checkout_date": body.checkout_date,
        "total_cost": 189.00 * 3
    }

@router.get("/add")
async def add(a: float, b: float):
    """Adds two numbers and returns the sum.

    Args:
        a (float): Addend 
        b (float): Addend
    """

    return {"sum": a+b}

@router.get("/multiply")
async def multiply(a: float, b: float):
    """Multiplies two numbers and returns the product.

    Args:
        a (float): Factor 
        b (float): Factor
    """

    return {
        "product": float(a) * float(b)
    }