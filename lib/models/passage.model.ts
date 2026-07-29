import mongoose, { Schema, models, model, Document } from "mongoose";
import { PASSAGE_KINDS, PassageKind, CLASS_LEVELS, ClassLevel } from "./constants";

// A Passage is the shared stimulus a group of questions all reference - a
// comprehension text, a chemistry experiment write-up, a data table, a
// described diagram. It lives in its own collection (not embedded on
// Question) so the text is stored once and referenced, not duplicated
// across every sub-question that uses it.
//
// A question opts into a passage via Question.passageId - that link is
// optional there, so every question that predates this feature keeps
// working unchanged with no migration needed.
export interface IPassage extends Document {
  title?: string;
  text: string;
  kind: PassageKind;
  subject: mongoose.Types.ObjectId;
  class: ClassLevel;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const passageSchema = new Schema<IPassage>(
  {
    // Optional - a data-response table or a described diagram often
    // doesn't have a natural title the way "A VISIT TO THE ZOO" does.
    title: {
      type: String,
      trim: true,
    },
    text: {
      type: String,
      required: [true, "Passage text is required"],
      trim: true,
    },
    kind: {
      type: String,
      required: [true, "Passage kind is required"],
      enum: { values: PASSAGE_KINDS, message: "{VALUE} is not a valid passage kind" },
      default: "comprehension",
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    class: {
      type: String,
      required: [true, "Class is required"],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true },
);

// Same filter shape as the question bank (by subject+class), since
// passages are browsed/created from the same screens.
passageSchema.index({ subject: 1, class: 1 });

export const Passage =
  (models.Passage as mongoose.Model<IPassage>) || model<IPassage>("Passage", passageSchema);
