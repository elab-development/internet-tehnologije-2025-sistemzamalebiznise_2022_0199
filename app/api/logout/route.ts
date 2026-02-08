// import { NextResponse } from 'next/server';

// export async function POST() {
//   const response = NextResponse.json(
//     { message: "Uspešno ste se odjavili" },
//     { status: 200 }
//   );

//   // Brisanje kolačića postavljanjem datuma isteka u prošlost
//   response.cookies.set('token', '', {
//     httpOnly: true,
//     expires: new Date(0),
//     path: '/',
//   });

//   return response;
// }