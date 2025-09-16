import { contactModel } from "../models/contact.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addContact = asyncHandler(async (req, res) => {
  const { contactEmail, firstname, lastname } = req.body;
  const { email } = req?.user;

  if (!email) {
    throw new ApiError(400, "Something went wrong!");
  }

  if (!contactEmail) {
    throw new ApiError(400, "ContactEmail are required");
  }

  // If user exists in Skayshare (our User model), fetch their details
  let existingContact = await contactModel.findOne({
    $and: [{ contactOwner: email }, { contactEmail }],
  });

  if (existingContact)
    throw new ApiError(400, "This Contact with email alredy exists!");

  const contactData = {
    contactOwner: email,
    contactEmail,
    firstname: firstname || "",
    lastname: lastname || "",
  };

  const contact = await contactModel.create(contactData);

  if (!contact) throw new ApiError(400, "Something went wrong");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isContactCreated: true, contact },
        `Contact created`
      )
    );
});

export const getMyContacts = asyncHandler(async (req, res) => {
  const { email } = req?.user;

  if (!email) {
    throw new ApiError(400, "Something went wrong!");
  }

  const contacts = await contactModel
    .find({ contactOwner: email })
    .sort({ contactEmail: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isContactFeatched: true, contacts },
        `Contact featchd`
      )
    );
});

export const searchMyContacts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { email } = req?.user;

  if (!email) {
    throw new ApiError(400, "Something went wrong!");
  }

  const regex = new RegExp(q, "i");

  const contacts = await contactModel.aggregate([
    {
      $match: {
        contactOwner: email,
        $or: [
          { firstname: regex },
          { lastname: regex },
          { contactEmail: regex },
        ],
      },
    },
    {
      $addFields: {
        startsWith: {
          $cond: [
            {
              $regexMatch: {
                input: "$contactEmail",
                regex: `^${q}`,
                options: "i",
              },
            },
            0, // highest priority (comes first)
            1, // comes after
          ],
        },
      },
    },
    { $sort: { startsWith: 1, contactEmail: 1 } }, // first by startsWith, then alphabetically
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isContactSearchd: true, contacts },
        `Contact searchd`
      )
    );
});
